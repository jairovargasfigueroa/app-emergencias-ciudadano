import { api } from '@/shared/api/cliente'

export type EstadoTraslado =
  | 'PROGRAMADO'
  | 'BUSCANDO_UNIDAD'
  | 'ASIGNADO'
  | 'COMPLETADO'
  | 'NO_REALIZADO'
  | 'NO_CUBIERTO'
  | 'CANCELADO'

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
  modoHorario: ModoHorario
  horaCita: string | null
  horaSalidaEstimada: string
  horaLimiteSalida: string
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

export const trasladosApi = {
  pedir: (datos: PedirTraslado) => api.post<Traslado>('/traslados', datos),
  mios: (signal?: AbortSignal) => api.get<Traslado[]>('/traslados/mios', { signal }),
  cancelar: (id: number) => api.post<Traslado>(`/traslados/${id}/cancelar`),
  actualizarDetalles: (id: number, datos: DetallesTraslado) =>
    api.put<Traslado>(`/traslados/${id}/detalles`, datos),
  centrosSalud: (signal?: AbortSignal) => api.get<CentroSalud[]>('/centros-salud', { signal }),
}
