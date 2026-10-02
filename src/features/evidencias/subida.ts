import { File, UploadType } from 'expo-file-system'

import { DEMO } from '@/features/demo/bandera'
import { ErrorApi } from '@/shared/api/cliente'

import { evidenciasApi, type SubidaEvidencia } from './api'
import { describirArchivo, type ArchivoDeEvidencia } from './archivo'
import { errorDeCancelacion, esCancelacion } from './conexion'
import { MAXIMO_POR_ALERTA } from './formatos'

/** Mensaje para cuando la emergencia ya juntó todos los archivos que el servidor recibe, entre todas sus alertas. */
export const MENSAJE_INCIDENTE_COMPLETO = 'Ya llegaron suficientes archivos de esta emergencia. Tu alerta sigue activa.'

type OpcionesError = {
  reintentable: boolean
  automatico?: boolean
  /** La emergencia ya no recibe más archivos: no tiene sentido ofrecer otro adjunto. */
  incidenteCompleto?: boolean
}

/**
 * Por qué no se pudo subir, con el mensaje listo para mostrar. `reintentable` dice si tiene sentido ofrecer
 * "Reintentar"; `automatico`, si conviene reintentar solo, sin que la persona haga nada (un corte de red, un 5xx).
 */
export class ErrorSubida extends Error {
  readonly reintentable: boolean
  readonly automatico: boolean
  readonly incidenteCompleto: boolean

  constructor(mensaje: string, { reintentable, automatico = false, incidenteCompleto = false }: OpcionesError) {
    super(mensaje)
    this.name = 'ErrorSubida'
    this.reintentable = reintentable
    this.automatico = reintentable && automatico
    this.incidenteCompleto = incidenteCompleto
  }
}

type Opciones = {
  alertaId: number
  archivo: ArchivoDeEvidencia
  /** La evidencia ya registrada en un intento anterior: se vuelve a firmar en vez de registrar otra. */
  evidenciaId?: number
  /** Apenas el servidor da el id, para que un reintento use la misma evidencia y no ocupe otro lugar de los cinco. */
  alRegistrar: (evidenciaId: number, archivo: ArchivoDeEvidencia) => void
  /** Avance del archivo, de 0 a 1. */
  alAvanzar: (avance: number) => void
  signal?: AbortSignal
}

/** Cuántas veces se pide otra URL si el almacén rechaza la firma (vencida o con la hora del teléfono corrida). */
const FIRMAS_MAXIMAS = 2

/**
 * Sube una evidencia de punta a punta: registrarla (o volver a firmarla), subir el archivo directo al almacén y
 * confirmar. Devuelve el id de la evidencia. Lo que falla llega como `ErrorSubida`; una cancelación, como `AbortError`.
 */
export async function subirEvidencia(opciones: Opciones): Promise<number> {
  if (DEMO) {
    return simularSubida(opciones)
  }
  try {
    return await subir(opciones)
  } catch (error) {
    if (esCancelacion(error) || error instanceof ErrorSubida) {
      throw error
    }
    throw traducirError(error)
  }
}

async function subir({ alertaId, archivo, evidenciaId, alRegistrar, alAvanzar, signal }: Opciones) {
  let id: number
  let subida: SubidaEvidencia | null
  if (evidenciaId === undefined) {
    const registrada = await evidenciasApi.registrar(alertaId, datosDe(archivo))
    id = registrada.evidenciaId
    subida = registrada
    alRegistrar(id, archivo)
  } else {
    id = evidenciaId
    subida = await firmarDeNuevo(id)
  }

  let firmas = 1
  let huellaRevisada = false
  // `null`: el servidor dice que el archivo ya llegó en un intento anterior; solo falta confirmar.
  while (subida) {
    const resultado = await new File(archivo.uri).upload(subida.urlSubida, {
      httpMethod: 'PUT',
      uploadType: UploadType.BINARY_CONTENT,
      headers: cabecerasDelPut(subida.cabeceras),
      onProgress: ({ bytesSent, totalBytes }) => {
        if (totalBytes > 0) {
          alAvanzar(Math.min(bytesSent / totalBytes, 1))
        }
      },
      // En primer plano: el `AbortSignal` y el avance solo existen mientras vive la app.
      sessionType: 'foreground',
      signal,
    })
    if (signal?.aborted) {
      throw errorDeCancelacion()
    }

    if (resultado.status >= 200 && resultado.status < 300) {
      break
    }
    // 403: la URL venció o la firma no cuadra. Se firma otra vez la misma evidencia y se vuelve a subir.
    if (resultado.status === 403 && firmas < FIRMAS_MAXIMAS) {
      firmas += 1
      subida = await firmarDeNuevo(id)
      continue
    }
    // BadDigest: lo que llegó no da el SHA-256 firmado. Si el archivo sigue igual fue un error en el camino y basta con
    // repetir; si cambió, la firma de esta evidencia ya no le sirve.
    if (resultado.status === 400 && resultado.body.includes('BadDigest') && !huellaRevisada) {
      huellaRevisada = true
      const actual = await describirArchivo(archivo.uri, archivo.mimeType, archivo.modalidad)
      if (actual.sha256 !== archivo.sha256 || actual.tamanoBytes !== archivo.tamanoBytes) {
        throw new ErrorSubida('El archivo cambió mientras se enviaba. Vuelve a adjuntarlo.', { reintentable: false })
      }
      continue
    }
    throw new ErrorSubida('No se pudo enviar el archivo.', {
      reintentable: true,
      automatico: resultado.status >= 500 || resultado.status === 403,
    })
  }

  alAvanzar(1)
  await evidenciasApi.confirmar(id)
  return id
}

/** Otra URL para la misma evidencia, o `null` si el servidor ya la tiene subida (un intento anterior llegó). */
async function firmarDeNuevo(evidenciaId: number): Promise<SubidaEvidencia | null> {
  try {
    return await evidenciasApi.firmarDeNuevo(evidenciaId)
  } catch (error) {
    if (error instanceof ErrorApi && error.codigo === 'EVIDENCIA_YA_SUBIDA') {
      return null
    }
    throw error
  }
}

/**
 * Las cabeceras firmadas, tal cual, menos `content-length`: la pone el propio cargador del teléfono a partir del
 * archivo, y mandarla dos veces hace que algunos servidores rechacen el pedido. Coincide con el tamaño firmado porque
 * es el mismo archivo.
 */
export function cabecerasDelPut(cabeceras: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(cabeceras).filter(([nombre]) => nombre.toLowerCase() !== 'content-length'))
}

function datosDe({ mimeType, tamanoBytes, sha256 }: ArchivoDeEvidencia) {
  return { mimeType, tamanoBytes, sha256 }
}

/** Los códigos del backend dichos con calma, como para alguien que está en plena emergencia. */
function traducirError(error: unknown): ErrorSubida {
  if (!(error instanceof ErrorApi)) {
    // El cargador nativo rechaza sin código cuando se corta la red a medio camino.
    return new ErrorSubida('Se cortó la conexión mientras se enviaba.', { reintentable: true, automatico: true })
  }
  switch (error.codigo) {
    case 'LIMITE_DE_EVIDENCIAS':
      return new ErrorSubida(`Ya enviaste ${MAXIMO_POR_ALERTA} archivos, el máximo para una alerta.`, {
        reintentable: false,
      })
    case 'LIMITE_DE_EVIDENCIAS_INCIDENTE':
      // Entre todas las alertas de la emergencia ya hay archivos de sobra: no es un error de la persona ni se reintenta.
      return new ErrorSubida(MENSAJE_INCIDENTE_COMPLETO, { reintentable: false, incidenteCompleto: true })
    case 'ALERTA_CERRADA':
      return new ErrorSubida('Tu caso ya se cerró, así que no hace falta enviar más archivos.', { reintentable: false })
    case 'FORMATO_NO_ADMITIDO':
      return new ErrorSubida('Este tipo de archivo no se puede enviar.', { reintentable: false })
    case 'EVIDENCIA_DEMASIADO_GRANDE':
      return new ErrorSubida('El archivo pesa más de lo que se puede enviar.', { reintentable: false })
    case 'ALMACENAMIENTO_NO_DISPONIBLE':
      return new ErrorSubida('Por ahora no se pueden recibir archivos. Tu alerta sigue activa.', { reintentable: true })
    case 'EVIDENCIA_NO_SUBIDA':
    case 'EVIDENCIA_NO_COINCIDE':
      // El servidor no encontró el archivo, o no es el que se anunció: se firma de nuevo y se vuelve a subir.
      return new ErrorSubida('El archivo no llegó completo.', { reintentable: true, automatico: true })
  }
  if (error.status === 0 || error.status >= 500) {
    return new ErrorSubida('No hay conexión con el servidor.', { reintentable: true, automatico: true })
  }
  // Lo demás (una alerta o evidencia que no es suya, un dato mal formado) no se arregla reintentando.
  return new ErrorSubida('No se pudo enviar el archivo.', { reintentable: false })
}

/**
 * Modo demostración: el archivo no sale del teléfono. Se simula el avance para mostrar el flujo completo sin cargar
 * nada en el almacén real.
 */
async function simularSubida({ archivo, alRegistrar, alAvanzar, signal }: Opciones): Promise<number> {
  const id = Date.now()
  alRegistrar(id, archivo)
  for (let paso = 1; paso <= 10; paso += 1) {
    await new Promise((resolver) => setTimeout(resolver, 200))
    if (signal?.aborted) {
      throw errorDeCancelacion()
    }
    alAvanzar(paso / 10)
  }
  return id
}
