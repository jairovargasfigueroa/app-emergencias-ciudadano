import * as SecureStore from 'expo-secure-store'

import type { OrigenUbicacion } from '@/features/alerta/api'

const CLAVE_SEGUIMIENTO = 'sga.seguimiento'

/** Lo mínimo para volver al caso en curso sin preguntarle nada al servidor: el id del incidente y de su alerta. */
export type SeguimientoGuardado = {
  incidenteId: number
  alertaId: number
  /** Hora de emisión en ISO-8601: alimenta el cronómetro (PB-06 CA-01). */
  enviadaEn: string
  latitud: number
  longitud: number
  origen: OrigenUbicacion
  /** Los detalles opcionales ya salieron (PB-02 R3): al volver al caso no se preguntan ni se envían otra vez. */
  detallesEnviados?: boolean
}

/**
 * El seguimiento vive en el teléfono mientras el incidente esté abierto: si la app se cierra o el teléfono se apaga,
 * el ciudadano no pierde su caso.
 */
export async function leerSeguimientoGuardado(): Promise<SeguimientoGuardado | null> {
  const guardado = await SecureStore.getItemAsync(CLAVE_SEGUIMIENTO)
  if (!guardado) {
    return null
  }
  try {
    return JSON.parse(guardado) as SeguimientoGuardado
  } catch {
    return null
  }
}

export function guardarSeguimiento(seguimiento: SeguimientoGuardado) {
  return SecureStore.setItemAsync(CLAVE_SEGUIMIENTO, JSON.stringify(seguimiento))
}

export function borrarSeguimientoGuardado() {
  return SecureStore.deleteItemAsync(CLAVE_SEGUIMIENTO)
}
