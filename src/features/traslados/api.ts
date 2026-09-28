import { api } from '@/shared/api/cliente'

export type EstadoTraslado =
  | 'PROGRAMADO'
  | 'BUSCANDO_UNIDAD'
  | 'ASIGNADO'
  | 'COMPLETADO'
  | 'NO_REALIZADO'
  | 'NO_CUBIERTO'
  | 'CANCELADO'

/** `EstadoAtencion` del backend: en qué va la unidad que tiene el traslado. */
export type EstadoUnidad =
  | 'EN_CAMINO'
  | 'EN_EL_LUGAR'
  | 'PACIENTE_RECOGIDO'
  | 'EN_HOSPITAL'
  | 'PACIENTE_ENTREGADO'
  | 'SIN_TRASLADO'
  | 'CANCELADA'

export type ModoHorario = 'INMEDIATO' | 'PROGRAMADO'

export type Movilidad = 'CAMINA_CON_AYUDA' | 'SILLA_DE_RUEDAS' | 'CAMILLA'

export type TipoUnidad = 'IA' | 'IB' | 'II' | 'III'

export type Ubicacion = {
  latitud: number
  longitud: number
}

/** `TrasladoResponse` del backend. */
export type Traslado = {
  id: number
  estado: EstadoTraslado
  /**
   * En qué va la unidad que lo tiene. Solo viene en `ASIGNADO`, `COMPLETADO` y `NO_REALIZADO`; mientras no salió
   * nadie es `null`. Dice hasta cuándo se puede cancelar: hasta que la unidad llega a la puerta.
   */
  estadoUnidad: EstadoUnidad | null
  modoHorario: ModoHorario
  horaCita: string | null
  horaSalidaEstimada: string
  horaLimiteSalida: string
  /** La ventana que se promete: cuándo pasa la unidad por el origen, no cuándo sale de donde esté. */
  horaRecogidaDesde: string | null
  horaRecogidaHasta: string | null
  pasajero: string
  movilidad: Movilidad
  oxigeno: boolean
  equipo: boolean
  aislamiento: boolean
  pesoAproximado: number | null
  acompanantes: number
  observaciones: string | null
  tipoUnidad: TipoUnidad
  tipoUnidadPedido: TipoUnidad
  origen: Ubicacion
  origenReferencia: string | null
  contactoNombre: string | null
  contactoTelefono: string | null
  destino: Ubicacion
  /** El centro del catálogo, si el destino es uno. Su punto es `destino`. */
  centroSaludDestinoId: number | null
  centroSaludDestino: string | null
  destinoDetalle: string | null
  fechaHoraCreacion: string
}

/** `RegistrarTrasladoRequest` del backend. Sin `pasajeroId` viaja quien pide; sin `horaCita` es para ahora. */
export type PedirTraslado = {
  pasajeroId?: number | null
  movilidad: Movilidad
  oxigeno: boolean
  equipo: boolean
  aislamiento: boolean
  pesoAproximado?: number | null
  acompanantes: number
  observaciones?: string | null
  tipoUnidad?: TipoUnidad | null
  origenLatitud: number
  origenLongitud: number
  origenReferencia?: string | null
  contactoNombre?: string | null
  contactoTelefono?: string | null
  centroSaludDestinoId?: number | null
  destinoLatitud?: number | null
  destinoLongitud?: number | null
  destinoDetalle?: string | null
  horaCita?: string | null
}

/** `DetallesTrasladoRequest` del backend: lo que se puede corregir hasta con la unidad en camino. */
export type DetallesTraslado = {
  origenReferencia?: string | null
  contactoNombre?: string | null
  contactoTelefono?: string | null
  observaciones?: string | null
}

/** `CentroSaludResponse` del backend. Trae su punto: sirve como origen o destino sin marcarlo en el mapa. */
export type CentroSalud = {
  id: number
  nombre: string
  direccion: string | null
  latitud: number
  longitud: number
}

/** Sigue esperando algo: su día, una unidad, o que la unidad llegue. */
export function trasladoVigente(estado: EstadoTraslado) {
  return estado === 'PROGRAMADO' || estado === 'BUSCANDO_UNIDAD' || estado === 'ASIGNADO'
}

/** Ya hay una unidad en camino: desde acá solo se pueden corregir la referencia y el contacto. */
export function tieneUnidad(estado: EstadoTraslado) {
  return estado === 'ASIGNADO'
}

/** La unidad ya está en la puerta, o más allá: con el paciente a bordo o en el destino. */
export function unidadYaLlego(traslado: Traslado) {
  return traslado.estadoUnidad !== null && traslado.estadoUnidad !== 'EN_CAMINO'
}

/**
 * Como en cualquier central, la familia puede cancelar antes de que salga la unidad o mientras viene. Cuando ya
 * está en la puerta se habla con la tripulación: el paciente podría estar a bordo.
 */
export function sePuedeCancelar(traslado: Traslado) {
  return trasladoVigente(traslado.estado) && !unidadYaLlego(traslado)
}

/**
 * Ya llegó la hora de salir: el sistema está buscando la unidad o ya la asignó. Un traslado `PROGRAMADO` puede
 * ser para dentro de tres días y todavía no tiene nada asignado, así que ahí las horas de salida no le dicen
 * nada a la familia.
 */
export function yaEsHoraDeSalir(estado: EstadoTraslado) {
  return estado === 'BUSCANDO_UNIDAD' || estado === 'ASIGNADO'
}

export const trasladosApi = {
  pedir: (datos: PedirTraslado) => api.post<Traslado>('/traslados', datos),
  mios: (signal?: AbortSignal) => api.get<Traslado[]>('/traslados/mios', { signal }),
  cancelar: (id: number) => api.post<Traslado>(`/traslados/${id}/cancelar`),
  actualizarDetalles: (id: number, datos: DetallesTraslado) =>
    api.put<Traslado>(`/traslados/${id}/detalles`, datos),
  centrosSalud: (signal?: AbortSignal) => api.get<CentroSalud[]>('/centros-salud', { signal }),
}
