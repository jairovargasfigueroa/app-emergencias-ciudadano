import type { DetallesAlerta } from '@/features/alerta/api'

/*
 * Opciones de las preguntas de la espera (PB-02 R3). Viven solo aquí: cambiar una lista es editar este archivo.
 * Los ids son estables y en mayúsculas porque serán los valores de campos propios en el servidor; mientras tanto,
 * lo que viaja es el texto, dentro de `descripcion`.
 */

export const PARA_QUIEN = [
  { id: 'PARA_MI', texto: 'Para mí' },
  { id: 'OTRA_PERSONA', texto: 'Para otra persona' },
] as const

export const TIPOS_DE_EMERGENCIA = [
  { id: 'ACCIDENTE_TRANSITO', texto: 'Accidente de tránsito' },
  { id: 'CAIDA', texto: 'Caída' },
  { id: 'DOLOR_PECHO', texto: 'Dolor de pecho' },
  { id: 'DIFICULTAD_RESPIRAR', texto: 'Le cuesta respirar' },
  { id: 'DESMAYO', texto: 'Se desmayó' },
  { id: 'SANGRADO_HERIDA', texto: 'Sangrado o herida' },
  { id: 'OTRO', texto: 'Otro' },
] as const

/** "4 o más" se envía como 4. */
export const OPCIONES_AFECTADOS = [
  { valor: 1, texto: '1', etiqueta: '1 persona' },
  { valor: 2, texto: '2', etiqueta: '2 personas' },
  { valor: 3, texto: '3', etiqueta: '3 personas' },
  { valor: 4, texto: '4 o más', etiqueta: '4 personas o más' },
] as const

export type IdParaQuien = (typeof PARA_QUIEN)[number]['id']
export type IdTipoEmergencia = (typeof TIPOS_DE_EMERGENCIA)[number]['id']

/** El tipo que abre un campo de texto: en pantalla lleva "…" y en la descripción, "Otro: lo que escribió". */
export const TIPO_OTRO: IdTipoEmergencia = 'OTRO'

export const LARGO_MAXIMO_OTRO = 80

export type Respuestas = {
  paraQuien: IdParaQuien | null
  tipo: IdTipoEmergencia | null
  /** Texto de "Otro". Solo cuenta si el tipo elegido es `OTRO`. */
  otro: string
  afectados: number | null
}

export const SIN_RESPUESTAS: Respuestas = { paraQuien: null, tipo: null, otro: '', afectados: null }

/**
 * Pedido de `POST /alertas/{alertaId}/detalles` con lo contestado. La descripción une para quién y el tipo con " · ",
 * en ese orden, y no se envía si no se eligió ninguno de los dos.
 */
export function detallesDeRespuestas({ paraQuien, tipo, otro, afectados }: Respuestas): DetallesAlerta {
  const partes: string[] = []
  if (paraQuien) {
    partes.push(textoDe(PARA_QUIEN, paraQuien))
  }
  if (tipo) {
    const texto = textoDe(TIPOS_DE_EMERGENCIA, tipo)
    const detalle = tipo === TIPO_OTRO ? otro.trim() : ''
    partes.push(detalle ? `${texto}: ${detalle}` : texto)
  }

  const detalles: DetallesAlerta = {}
  if (afectados !== null) {
    detalles.cantidadAfectados = afectados
  }
  if (partes.length > 0) {
    detalles.descripcion = partes.join(' · ')
  }
  return detalles
}

export function hayRespuestas(detalles: DetallesAlerta) {
  return detalles.cantidadAfectados !== undefined || detalles.descripcion !== undefined
}

function textoDe(opciones: readonly { id: string; texto: string }[], id: string) {
  return opciones.find((opcion) => opcion.id === id)?.texto ?? ''
}
