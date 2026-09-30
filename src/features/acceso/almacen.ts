import * as SecureStore from 'expo-secure-store'

/**
 * El último número con el que se entró en este teléfono. Tiene su propia clave, aparte de la sesión, para que sobreviva
 * a cerrarla: al volver a entrar, el número ya aparece escrito.
 */
const CLAVE_ULTIMO_NUMERO = 'sga.acceso.ultimo-numero'

/** Los 8 dígitos, o `null`. Si el almacén falla, la persona escribe su número y listo: no hay nada más que hacer. */
export async function leerUltimoNumero(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CLAVE_ULTIMO_NUMERO)
  } catch {
    return null
  }
}

export function guardarUltimoNumero(numero: string) {
  return SecureStore.setItemAsync(CLAVE_ULTIMO_NUMERO, numero)
}
