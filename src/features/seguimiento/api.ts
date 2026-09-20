export type EstadoIncidente = 'ACTIVO' | 'EN_ATENCION' | 'ATENDIDO' | 'FALSA_ALARMA' | 'ATENDIDO_EXTERNAMENTE' | 'CANCELADO'

/** Solo se publican las atenciones activas: una unidad entregada o cancelada deja de aparecer (PB-06 R2). */
export type EstadoAtencion = 'EN_CAMINO' | 'EN_EL_LUGAR' | 'PACIENTE_RECOGIDO' | 'EN_HOSPITAL'

const ESTADOS_ATENCION: readonly EstadoAtencion[] = [
  'EN_CAMINO',
  'EN_EL_LUGAR',
  'PACIENTE_RECOGIDO',
  'EN_HOSPITAL',
]

/** PB-06 R2: el ciudadano solo ve unidades con atención activa. Cualquier otro estado se descarta. */
export function esEstadoAtencion(estado: unknown): estado is EstadoAtencion {
  return (ESTADOS_ATENCION as readonly unknown[]).includes(estado)
}

export type PosicionUnidad = {
  latitud: number
  longitud: number
  /** Momento de la posición, en ISO-8601. */
  en?: string
}

export type UnidadSeguimiento = {
  ambulanciaId: number
  placa: string
  estado: EstadoAtencion
  posicion?: PosicionUnidad
}

/** Nodo `/seguimiento/{incidenteId}` de Firebase, que publica el servidor para la app del ciudadano. */
export type Seguimiento = {
  incidenteId: number
  estado: EstadoIncidente
  actualizadoEn: string
  unidades: UnidadSeguimiento[]
}

export const ESTADOS_FINALES: readonly EstadoIncidente[] = ['ATENDIDO', 'FALSA_ALARMA', 'ATENDIDO_EXTERNAMENTE', 'CANCELADO']

export function esEstadoFinal(estado: EstadoIncidente) {
  return ESTADOS_FINALES.includes(estado)
}
