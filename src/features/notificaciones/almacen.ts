import * as SecureStore from 'expo-secure-store'

const CLAVE_PERMISO_PREGUNTADO = 'sga.avisos.permiso-preguntado'

/**
 * Si ya se le preguntó a la persona por los avisos. Se pregunta una sola vez: si dice que no, la app no vuelve a
 * preguntar sola, y eso tiene que durar aunque la cierre.
 */
export async function permisoYaPreguntado() {
  return (await SecureStore.getItemAsync(CLAVE_PERMISO_PREGUNTADO)) !== null
}

export function recordarPermisoPreguntado() {
  return SecureStore.setItemAsync(CLAVE_PERMISO_PREGUNTADO, 'si')
}
