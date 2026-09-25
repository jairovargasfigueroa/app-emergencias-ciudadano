import { api } from '@/shared/api/cliente'

/**
 * `PersonaResponse` del backend. Son las personas que el ciudadano carga: su mamá, a la que traslada, o su
 * hermano como contacto. No son cuentas y no inician sesión, así que varias pueden compartir un teléfono.
 */
export type Persona = {
  id: number
  nombreCompleto: string
  telefono: string
}

/** `RegistrarPersonaRequest` del backend. */
export type RegistrarPersona = {
  nombreCompleto: string
  telefono: string
}

export const personasApi = {
  mias: (signal?: AbortSignal) => api.get<Persona[]>('/personas', { signal }),
  registrar: (datos: RegistrarPersona) => api.post<Persona>('/personas', datos),
  olvidar: (id: number) => api.borrar<void>(`/personas/${id}`),
}
