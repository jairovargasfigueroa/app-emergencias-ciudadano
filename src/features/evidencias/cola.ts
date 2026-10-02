import { randomUUID } from 'expo-crypto'
import { useSyncExternalStore } from 'react'

import type { ArchivoDeEvidencia } from './archivo'
import { errorDeCancelacion, esCancelacion, esperarConexion } from './conexion'
import { MAXIMO_POR_ALERTA } from './formatos'
import { ErrorSubida, subirEvidencia } from './subida'

/**
 * `sin-senal`: espera a que vuelva la red para empezar. `reintentando`: se cortó y vuelve a probar sola en un momento.
 * `fallo`: ya no prueba sola; si `reintentable`, la persona puede pedirlo.
 */
export type EstadoSubida = 'subiendo' | 'sin-senal' | 'reintentando' | 'enviada' | 'fallo'

/** Una evidencia de este teléfono y cómo va su envío. */
export type EvidenciaLocal = {
  /** Id local, para la lista: el servidor da el suyo recién al registrarla. */
  clave: string
  alertaId: number
  archivo: ArchivoDeEvidencia
  evidenciaId?: number
  estado: EstadoSubida
  /** De 0 a 1. */
  avance: number
  error?: string
  reintentable: boolean
}

/** Esperas antes de cada reintento automático. Después del último, queda en `fallo` con el botón para reintentar. */
const ESPERAS_MS = [2_000, 5_000, 15_000]

const SIN_EVIDENCIAS: readonly EvidenciaLocal[] = []

/*
 * Las subidas viven fuera de React, como el simulador del modo demostración: siguen aunque la hoja del seguimiento
 * cambie de contenido o se desmonte la sección. Se pierden si se cierra la app, igual que el archivo a medio subir.
 */
let porAlerta: Record<number, readonly EvidenciaLocal[]> = {}
/** Alertas cuya emergencia ya no recibe más archivos: el servidor lo avisó al intentar registrar uno. */
let incidentesCompletos: ReadonlySet<number> = new Set()
const controladores = new Map<string, AbortController>()
const oyentes = new Set<() => void>()

/** Las evidencias de una alerta, en el orden en que se adjuntaron. */
export function useEvidencias(alertaId: number) {
  return useSyncExternalStore(suscribir, () => porAlerta[alertaId] ?? SIN_EVIDENCIAS)
}

/** Si la emergencia de esta alerta ya juntó todos los archivos que recibe: no se ofrecen más adjuntos. */
export function useIncidenteCompleto(alertaId: number) {
  return useSyncExternalStore(suscribir, () => incidentesCompletos.has(alertaId))
}

/**
 * Cuántas evidencias más se pueden adjuntar. Cuenta las que ya ocupan un lugar en el servidor o lo van a ocupar; una
 * rechazada antes de registrarse no cuenta. El servidor lo vuelve a revisar igual.
 */
export function lugaresLibres(evidencias: readonly EvidenciaLocal[]) {
  const ocupadas = evidencias.filter(
    (evidencia) => !(evidencia.estado === 'fallo' && !evidencia.reintentable && evidencia.evidenciaId === undefined),
  )
  return Math.max(MAXIMO_POR_ALERTA - ocupadas.length, 0)
}

/** Agrega el archivo a la lista y empieza a subirlo. Devuelve `false` si ya no hay lugar. */
export function adjuntar(alertaId: number, archivo: ArchivoDeEvidencia) {
  if (incidentesCompletos.has(alertaId) || lugaresLibres(porAlerta[alertaId] ?? SIN_EVIDENCIAS) === 0) {
    return false
  }
  const evidencia: EvidenciaLocal = {
    clave: randomUUID(),
    alertaId,
    archivo,
    estado: 'subiendo',
    avance: 0,
    reintentable: true,
  }
  publicar(alertaId, [...(porAlerta[alertaId] ?? SIN_EVIDENCIAS), evidencia])
  void procesar(alertaId, evidencia.clave)
  return true
}

/** "Reintentar": vuelve a empezar, usando la misma evidencia si el servidor ya la había registrado. */
export function reintentar(alertaId: number, clave: string) {
  const evidencia = buscar(alertaId, clave)
  if (evidencia?.estado === 'fallo' && evidencia.reintentable) {
    void procesar(alertaId, clave)
  }
}

/** Saca de la lista una evidencia que no salió. Una enviada ya está en el servidor y no se quita. */
export function quitar(alertaId: number, clave: string) {
  const evidencia = buscar(alertaId, clave)
  if (!evidencia || evidencia.estado === 'enviada') {
    return
  }
  controladores.get(clave)?.abort()
  controladores.delete(clave)
  publicar(alertaId, (porAlerta[alertaId] ?? SIN_EVIDENCIAS).filter((otra) => otra.clave !== clave))
}

/** Corta las subidas de una alerta y la olvida: el caso terminó para este teléfono. */
export function olvidarEvidencias(alertaId: number) {
  for (const evidencia of porAlerta[alertaId] ?? SIN_EVIDENCIAS) {
    controladores.get(evidencia.clave)?.abort()
    controladores.delete(evidencia.clave)
  }
  const resto = { ...porAlerta }
  delete resto[alertaId]
  porAlerta = resto
  if (incidentesCompletos.has(alertaId)) {
    incidentesCompletos = new Set([...incidentesCompletos].filter((otra) => otra !== alertaId))
  }
  oyentes.forEach((oyente) => oyente())
}

/**
 * Sube una evidencia con sus reintentos. Antes de cada intento espera a tener red; si se corta, vuelve a probar sola
 * unas pocas veces, cada vez esperando un poco más, y después deja la decisión a la persona.
 */
async function procesar(alertaId: number, clave: string) {
  controladores.get(clave)?.abort()
  const controlador = new AbortController()
  controladores.set(clave, controlador)
  const { signal } = controlador

  try {
    for (let intento = 0; ; intento += 1) {
      actualizar(alertaId, clave, { estado: 'subiendo', avance: 0, error: undefined, reintentable: true })
      await esperarConexion(signal, () => actualizar(alertaId, clave, { estado: 'sin-senal' }))
      actualizar(alertaId, clave, { estado: 'subiendo' })

      const evidencia = buscar(alertaId, clave)
      if (!evidencia) {
        return
      }
      try {
        const evidenciaId = await subirEvidencia({
          alertaId,
          archivo: evidencia.archivo,
          evidenciaId: evidencia.evidenciaId,
          alRegistrar: (id) => actualizar(alertaId, clave, { evidenciaId: id }),
          alAvanzar: (avance) => avanzar(alertaId, clave, avance),
          signal,
        })
        actualizar(alertaId, clave, { estado: 'enviada', avance: 1, evidenciaId })
        return
      } catch (error) {
        if (esCancelacion(error)) {
          throw error
        }
        const fallo =
          error instanceof ErrorSubida ? error : new ErrorSubida('No se pudo enviar el archivo.', { reintentable: true })
        if (fallo.automatico && intento < ESPERAS_MS.length) {
          actualizar(alertaId, clave, { estado: 'reintentando', error: fallo.message })
          await pausa(ESPERAS_MS[intento], signal)
          continue
        }
        if (fallo.incidenteCompleto) {
          marcarIncidenteCompleto(alertaId)
        }
        actualizar(alertaId, clave, { estado: 'fallo', error: fallo.message, reintentable: fallo.reintentable })
        return
      }
    }
  } catch (error) {
    // Cancelada: la quitaron de la lista o el caso terminó. No hay nada que mostrar.
    if (!esCancelacion(error)) {
      actualizar(alertaId, clave, { estado: 'fallo', error: 'No se pudo enviar el archivo.', reintentable: true })
    }
  } finally {
    if (controladores.get(clave) === controlador) {
      controladores.delete(clave)
    }
  }
}

/** El avance se publica de a un punto por ciento: el cargador avisa mucho más seguido de lo que se nota en pantalla. */
function avanzar(alertaId: number, clave: string, avance: number) {
  const anterior = buscar(alertaId, clave)?.avance ?? 0
  if (avance >= 1 || avance - anterior >= 0.01) {
    actualizar(alertaId, clave, { avance })
  }
}

function pausa(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const reloj = setTimeout(() => {
      signal.removeEventListener('abort', alCancelar)
      resolve()
    }, ms)
    function alCancelar() {
      clearTimeout(reloj)
      reject(errorDeCancelacion())
    }
    signal.addEventListener('abort', alCancelar)
  })
}

/** Queda marcada aunque se quite de la lista el archivo rechazado: la emergencia sigue sin recibir más. */
function marcarIncidenteCompleto(alertaId: number) {
  if (!incidentesCompletos.has(alertaId)) {
    incidentesCompletos = new Set([...incidentesCompletos, alertaId])
  }
}

function buscar(alertaId: number, clave: string) {
  return porAlerta[alertaId]?.find((evidencia) => evidencia.clave === clave)
}

function actualizar(alertaId: number, clave: string, cambios: Partial<EvidenciaLocal>) {
  const lista = porAlerta[alertaId]
  if (!lista?.some((evidencia) => evidencia.clave === clave)) {
    return
  }
  publicar(alertaId, lista.map((evidencia) => (evidencia.clave === clave ? { ...evidencia, ...cambios } : evidencia)))
}

function publicar(alertaId: number, lista: readonly EvidenciaLocal[]) {
  porAlerta = { ...porAlerta, [alertaId]: lista }
  oyentes.forEach((oyente) => oyente())
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
