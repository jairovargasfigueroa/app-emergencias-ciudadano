import * as SecureStore from 'expo-secure-store'

/** Lo que queda guardado en el teléfono al entrar: el token con el que se llama a la API y quién es. */
export type Sesion<T> = {
  token: string
  usuario: T
}

const CLAVE_SESION = 'sga.sesion'

/** Copia en memoria del token, para no leer el almacén seguro en cada petición. */
let tokenEnMemoria: string | null | undefined
let lectura: Promise<string | null> | null = null

export async function leerSesion<T>(): Promise<Sesion<T> | null> {
  const guardada = await SecureStore.getItemAsync(CLAVE_SESION)
  if (!guardada) {
    tokenEnMemoria = null
    return null
  }
  try {
    const sesion = JSON.parse(guardada) as Sesion<T>
    tokenEnMemoria = sesion.token
    return sesion
  } catch {
    tokenEnMemoria = null
    return null
  }
}

export async function guardarSesion<T>(sesion: Sesion<T>) {
  tokenEnMemoria = sesion.token
  await SecureStore.setItemAsync(CLAVE_SESION, JSON.stringify(sesion))
}

export async function borrarSesion() {
  tokenEnMemoria = null
  await SecureStore.deleteItemAsync(CLAVE_SESION)
}

/** Token de la sesión abierta, o `null`. Lo lee el cliente HTTP en cada petición. */
export async function tokenActual(): Promise<string | null> {
  if (tokenEnMemoria !== undefined) {
    return tokenEnMemoria
  }
  // Varias peticiones al abrir la app comparten la misma lectura del almacén.
  lectura ??= leerSesion().then((sesion) => {
    lectura = null
    return sesion?.token ?? null
  })
  return lectura
}
