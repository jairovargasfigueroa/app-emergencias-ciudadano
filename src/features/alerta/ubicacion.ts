import * as Location from 'expo-location'
import { Platform } from 'react-native'

export type Coordenadas = {
  latitud: number
  longitud: number
}

export type EstadoGps = 'listo' | 'sinPermiso' | 'apagado'

/** Espera máxima por la posición antes de pasar al pin manual (PB-02 R2). */
const ESPERA_MAXIMA_GPS_MS = 10_000

/** Antigüedad máxima de la última posición conocida para arrancar ahí el mapa del pin. Se configura en .env.local. */
const EDAD_MAXIMA_UBICACION_MIN = minutosDeEntorno(process.env.EXPO_PUBLIC_EDAD_MAXIMA_UBICACION_MIN)

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
 * Posición GPS actual, o `null` para pasar al pin: la alerta nunca se rechaza por falta de GPS (PB-02 R2). Antes de
 * rendirse intenta lo que el teléfono permite: conseguir el permiso, encender la ubicación y esperar la posición. Con
 * permiso y GPS encendido no aparece ningún cuadro del sistema (PB-02 CA-01).
 */
export async function obtenerUbicacionGps(): Promise<Coordenadas | null> {
  try {
    if (!(await conseguirPermiso()) || !(await encenderUbicacion())) {
      return null
    }
    // Paso 3: la posición, con límite de tiempo.
    const posicion = await conLimiteDeTiempo(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      ESPERA_MAXIMA_GPS_MS,
    )
    return posicion ? coordenadasDe(posicion) : null
  } catch {
    return null
  }
}

/** Paso 1: el permiso. Si falta y el sistema todavía deja preguntar, se pide con su cuadro; si no, se pasa al pin. */
async function conseguirPermiso() {
  const permiso = await Location.getForegroundPermissionsAsync()
  if (permiso.granted) {
    return true
  }
  if (!permiso.canAskAgain) {
    return false
  }
  return (await Location.requestForegroundPermissionsAsync()).granted
}

/**
 * Paso 2: la ubicación del teléfono encendida. En Android se pide con el cuadro del sistema, que falla si la persona no
 * la enciende; iOS no deja encenderla desde la app, así que se pasa al pin.
 */
async function encenderUbicacion() {
  if (await Location.hasServicesEnabledAsync()) {
    return true
  }
  if (Platform.OS !== 'android') {
    return false
  }
  try {
    await Location.enableNetworkProviderAsync()
  } catch {
    return false
  }
  return Location.hasServicesEnabledAsync()
}

/**
 * Última posición que conoce el teléfono, para arrancar ahí el mapa del pin. `null` si no hay permiso, no existe o es
 * más vieja que la edad máxima: un punto viejo no se da por bueno.
 */
export async function ultimaUbicacionReciente(): Promise<Coordenadas | null> {
  try {
    const permiso = await Location.getForegroundPermissionsAsync()
    if (!permiso.granted) {
      return null
    }
    const posicion = await Location.getLastKnownPositionAsync({ maxAge: EDAD_MAXIMA_UBICACION_MIN * 60_000 })
    return posicion ? coordenadasDe(posicion) : null
  } catch {
    return null
  }
}

function coordenadasDe(posicion: Location.LocationObject): Coordenadas {
  return { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude }
}

function minutosDeEntorno(valor: string | undefined) {
  const minutos = Number(valor)
  return valor && Number.isFinite(minutos) && minutos > 0 ? minutos : 5
}

/** expo-location no tiene opción de tiempo máximo: si la promesa no termina a tiempo, devuelve `null`. */
function conLimiteDeTiempo<T>(promesa: Promise<T>, milisegundos: number): Promise<T | null> {
  let temporizador: ReturnType<typeof setTimeout> | undefined
  const limite = new Promise<null>((resolver) => {
    temporizador = setTimeout(() => resolver(null), milisegundos)
  })
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador))
}
