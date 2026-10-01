import { api } from '@/shared/api/cliente'

/** `DispositivoRequest` del backend: el teléfono al que se le mandan los avisos. */
export type Dispositivo = {
  tokenPush: string
}

export const notificacionesApi = {
  /** A qué teléfono mandar los avisos de la alerta y de los traslados. Uno nuevo reemplaza al anterior. */
  registrarDispositivo: (dispositivo: Dispositivo) => api.post<void>('/ciudadanos/actual/dispositivo', dispositivo),
  /** Este teléfono deja de recibir los avisos de la cuenta. Responde 204. */
  quitarDispositivo: (signal?: AbortSignal) => api.borrar<void>('/ciudadanos/actual/dispositivo', { signal }),
}
