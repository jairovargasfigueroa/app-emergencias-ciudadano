import { api } from '@/shared/api/cliente'

/** `CiudadanoResponse` del backend. */
export type Ciudadano = {
  id: number
  nombreCompleto: string
  telefono: string
}

/**
 * `IngresoCiudadanoRequest` del backend. El nombre y el aviso de privacidad aceptado solo hacen falta la primera vez,
 * cuando el número todavía no tiene cuenta.
 */
export type IngresoCiudadano = {
  /** ID token de Firebase del usuario que verificó su número con el código del SMS. */
  idToken: string
  nombreCompleto?: string
  aceptaPrivacidad?: boolean
}

/** `SesionResponse.Ciudadano` del backend: el token, cuándo vence y el ciudadano al que pertenece. */
export type SesionCiudadano = {
  token: string
  /** ISO-8601 en UTC: es el `exp` del token. */
  venceEn: string
  ciudadano: Ciudadano
}

/** `SesionResponse.Renovada` del backend: el token nuevo, que reemplaza al que estaba por vencer. */
export type SesionRenovada = {
  token: string
  /** ISO-8601 en UTC: es el `exp` del token nuevo. */
  venceEn: string
}

export const accesoApi = {
  /**
   * Entrar y registrarse son lo mismo: con el número verificado entra a la cuenta de ese número o, la primera vez, la
   * crea. Si el número no tiene cuenta y no vienen el nombre y el aviso aceptado, responde 409 `NOMBRE_REQUERIDO`.
   */
  ingresar: (datos: IngresoCiudadano) => api.post<SesionCiudadano>('/auth/ciudadano', datos, { sinToken: true }),
  /** Cambia el token de la sesión por uno nuevo, sin cuerpo. Un 401 quiere decir que ya no se puede renovar. */
  renovar: () => api.post<SesionRenovada>('/sesion/renovacion'),
}
