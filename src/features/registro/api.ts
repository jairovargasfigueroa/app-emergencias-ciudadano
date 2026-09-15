import { api } from '@/shared/api/cliente'

/** `CiudadanoResponse` del backend. */
export type Ciudadano = {
  id: number
  nombreCompleto: string
  telefono: string
}

/** `RegistrarCiudadanoRequest` del backend. */
export type RegistrarCiudadano = {
  nombreCompleto: string
  telefono: string
}

export const registroApi = {
  /** Registro ligero. Si el teléfono ya estaba registrado, devuelve ese mismo ciudadano. */
  registrar: (datos: RegistrarCiudadano) => api.post<Ciudadano>('/ciudadanos', datos),
}
