import * as Location from 'expo-location'

export type Coordenadas = {
  latitud: number
  longitud: number
}

export type EstadoGps = 'listo' | 'sinPermiso' | 'apagado'

/** Espera máxima por la posición antes de pasar al pin manual (PB-02 R2). */
const ESPERA_MAXIMA_GPS_MS = 10_000

/**
 * Pide el permiso de ubicación si nunca se preguntó. Se llama al abrir la pantalla del botón para que, al
 * presionarlo, no aparezca ningún diálogo en medio (PB-02 CA-01).
 */
export async function prepararPermisoDeUbicacion() {
  const permiso = await Location.getForegroundPermissionsAsync()
  if (permiso.status === Location.PermissionStatus.UNDETERMINED && permiso.canAskAgain) {
    await Location.requestForegroundPermissionsAsync()
  }
}

export async function consultarEstadoGps(): Promise<EstadoGps> {
  const permiso = await Location.getForegroundPermissionsAsync()
  if (!permiso.granted) {
    return 'sinPermiso'
  }
  return (await Location.hasServicesEnabledAsync()) ? 'listo' : 'apagado'
}

/**
 * Posición GPS actual, o `null` si no hay permiso, el GPS está apagado, falla o tarda demasiado. Con `null` la app
 * pide fijar el pin: la alerta nunca se rechaza por falta de GPS.
 */
export async function obtenerUbicacionGps(): Promise<Coordenadas | null> {
  try {
    await prepararPermisoDeUbicacion()
    if ((await consultarEstadoGps()) !== 'listo') {
      return null
    }
    const posicion = await conLimiteDeTiempo(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      ESPERA_MAXIMA_GPS_MS,
    )
    return posicion ? coordenadasDe(posicion) : null
  } catch {
    return null
  }
}

/** Última posición que conoce el teléfono, para centrar el mapa del pin. Puede ser vieja o no existir. */
export async function ultimaUbicacionConocida(): Promise<Coordenadas | null> {
  try {
    const permiso = await Location.getForegroundPermissionsAsync()
    if (!permiso.granted) {
      return null
    }
    const posicion = await Location.getLastKnownPositionAsync()
    return posicion ? coordenadasDe(posicion) : null
  } catch {
    return null
  }
}

function coordenadasDe(posicion: Location.LocationObject): Coordenadas {
  return { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude }
}

/** expo-location no tiene opción de tiempo máximo: si la promesa no termina a tiempo, devuelve `null`. */
function conLimiteDeTiempo<T>(promesa: Promise<T>, milisegundos: number): Promise<T | null> {
  let temporizador: ReturnType<typeof setTimeout> | undefined
  const limite = new Promise<null>((resolver) => {
    temporizador = setTimeout(() => resolver(null), milisegundos)
  })
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador))
}
