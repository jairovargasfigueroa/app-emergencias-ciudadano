import { api } from '@/shared/api/cliente'

export type OrigenUbicacion = 'GPS' | 'MANUAL'

/** `CrearAlertaRequest` del backend. PB-02 R3: la alerta sale solo con la ubicación, sin ningún dato más. */
export type CrearAlerta = {
  latitud: number
  longitud: number
  origenUbicacion: OrigenUbicacion
}

/** `CompletarDetallesRequest` del backend. Solo se envían los campos que el ciudadano contestó. */
export type DetallesAlerta = {
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

  /**
   * Detalles opcionales de una alerta ya emitida (PB-02 R3): se contestan durante la espera y nunca bloquean nada.
   * El backend los acepta mientras el incidente siga abierto y ninguna unidad haya llegado al lugar.
   */
  completarDetalles: (ciudadanoId: number, alertaId: number, detalles: DetallesAlerta) =>
    api.post<AlertaCreada>(`/alertas/${alertaId}/detalles`, detalles, { usuarioId: ciudadanoId }),
}
