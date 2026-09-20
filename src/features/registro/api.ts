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

/** `SesionResponse.Ciudadano` del backend: el token y el ciudadano al que pertenece. */
export type SesionCiudadano = {
  token: string
  ciudadano: Ciudadano
}

export const registroApi = {
  /** Registro ligero: es la entrada a la app. Si el teléfono ya estaba registrado, devuelve ese mismo ciudadano. */
  registrar: (datos: RegistrarCiudadano) => api.post<SesionCiudadano>('/auth/ciudadano', datos, { sinToken: true }),
}
