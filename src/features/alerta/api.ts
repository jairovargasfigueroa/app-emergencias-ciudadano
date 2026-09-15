import { api } from '@/shared/api/cliente'

export type OrigenUbicacion = 'GPS' | 'MANUAL'

/** `CrearAlertaRequest` del backend. Afectados y descripción son opcionales. */
export type CrearAlerta = {
  latitud: number
  longitud: number
  origenUbicacion: OrigenUbicacion
  cantidadAfectados?: number
  descripcion?: string
}

/** `AlertaResponse` del backend. */
export type AlertaCreada = {
  alertaId: number
  incidenteId: number
  fechaHora: string
}

export const alertaApi = {
  emitir: (ciudadanoId: number, datos: CrearAlerta) =>
    api.post<AlertaCreada>('/alertas', datos, { usuarioId: ciudadanoId }),
}
