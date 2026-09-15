import * as SecureStore from 'expo-secure-store'

import type { Ciudadano } from './api'

const CLAVE_CIUDADANO = 'sga.ciudadano'

/** El registro ligero se hace una sola vez: el ciudadano queda guardado en el teléfono. */
export async function leerCiudadanoGuardado(): Promise<Ciudadano | null> {
  const guardado = await SecureStore.getItemAsync(CLAVE_CIUDADANO)
  if (!guardado) {
    return null
  }
  try {
    return JSON.parse(guardado) as Ciudadano
  } catch {
    return null
  }
}

export function guardarCiudadano(ciudadano: Ciudadano) {
  return SecureStore.setItemAsync(CLAVE_CIUDADANO, JSON.stringify(ciudadano))
}

export function borrarCiudadanoGuardado() {
  return SecureStore.deleteItemAsync(CLAVE_CIUDADANO)
}
