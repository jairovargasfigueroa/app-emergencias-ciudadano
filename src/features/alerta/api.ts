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

/** `MotivoCancelacionAlerta` del backend. */
export type MotivoRetiro = 'YA_FUE_ATENDIDO' | 'FALSA_ALARMA' | 'ERROR' | 'OTRO'

/** `CancelarAlertaRequest` del backend. */
export type RetirarPedido = {
  motivo: MotivoRetiro
  /** Si quien avisó es la persona que necesitaba la ambulancia. Un tercero no habla por el estado de otro. */
  emisorEsPaciente?: boolean
}

/** `AlertaResponse` del backend. */
export type AlertaCreada = {
  alertaId: number
  incidenteId: number
  fechaHora: string
}

export const alertaApi = {
  emitir: (datos: CrearAlerta) => api.post<AlertaCreada>('/alertas', datos),

  /**
   * Detalles opcionales de una alerta ya emitida (PB-02 R3): se contestan durante la espera y nunca bloquean nada.
   * El backend los acepta mientras el incidente siga abierto y ninguna unidad haya llegado al lugar.
   */
  completarDetalles: (alertaId: number, detalles: DetallesAlerta) =>
    api.post<AlertaCreada>(`/alertas/${alertaId}/detalles`, detalles),

  /**
   * Retirar el pedido. No siempre cierra el caso: si otro también avisó, o si ya hay una unidad en camino, el
   * incidente sigue y lo resuelve quien corresponde. El backend lo rechaza si una unidad ya llegó al lugar.
   */
  retirar: (alertaId: number, datos: RetirarPedido) =>
    api.post<AlertaCreada>(`/alertas/${alertaId}/cancelacion`, datos),
}
