import { isRunningInExpoGo } from 'expo'
import type { DevicePushToken } from 'expo-notifications'
import { Platform } from 'react-native'

import { permisoYaPreguntado, recordarPermisoPreguntado } from './almacen'
import { notificacionesApi } from './api'

/** Canal de Android de los avisos. app.json lo declara como canal por defecto de FCM. */
export const CANAL_AVISOS = 'avisos'

type ModuloNotificaciones = typeof import('expo-notifications')

/**
 * Expo Go para Android no trae push desde el SDK 53 y expo-notifications lanza un error apenas se importa. Por eso
 * se carga solo donde hay push (development build, o iOS); en Expo Go para Android la app sigue sin avisos.
 */
const pushDisponible = !(Platform.OS === 'android' && isRunningInExpoGo())

let moduloNotificaciones: Promise<ModuloNotificaciones | null> | null = null

export function cargarNotificaciones(): Promise<ModuloNotificaciones | null> {
  moduloNotificaciones ??= pushDisponible ? import('expo-notifications').catch(() => null) : Promise.resolve(null)
  return moduloNotificaciones
}

/** Qué hacer con el permiso al arrancar con sesión: registrar el teléfono, preguntar si quiere avisos, o nada. */
export type PermisoDeAvisos = 'concedido' | 'preguntar' | 'no'

/**
 * Deja listo el canal de Android y dice qué hacer con el permiso. Se pregunta una sola vez: al terminar el registro o,
 * si ya estaba registrado, la primera vez que la app arranca con sesión. Nunca en el camino de pedir ayuda.
 */
export async function prepararAvisos(): Promise<PermisoDeAvisos> {
  const Notifications = await cargarNotificaciones()
  if (!Notifications) {
    return 'no'
  }
  try {
    if (Platform.OS === 'android') {
      // El canal debe existir antes de pedir el permiso y el token.
      await Notifications.setNotificationChannelAsync(CANAL_AVISOS, {
        name: 'Avisos de tus pedidos',
        importance: Notifications.AndroidImportance.MAX,
      })
    }
    const permiso = await Notifications.getPermissionsAsync()
    if (permiso.granted) {
      return 'concedido'
    }
    // Android deja pedirlo otra vez después de un primer no: que ya se preguntó queda anotado en el teléfono.
    return permiso.canAskAgain && !(await permisoYaPreguntado()) ? 'preguntar' : 'no'
  } catch {
    return 'no'
  }
}

/** La persona quiere los avisos: sale el cuadro del sistema y, si da el permiso, se registra el teléfono. */
export async function activarAvisos() {
  const Notifications = await cargarNotificaciones()
  if (!Notifications) {
    return
  }
  await recordarPermisoPreguntado().catch(() => {})
  try {
    const permiso = await Notifications.requestPermissionsAsync()
    if (permiso.granted) {
      await registrarDispositivo()
    }
  } catch {
    // Sin permiso o sin soporte: el caso se sigue viendo al abrir la app.
  }
}

/** Dijo que ahora no, o cerró la hoja: no se le vuelve a preguntar. */
export function descartarAvisos() {
  return recordarPermisoPreguntado().catch(() => {})
}

/**
 * Registra el token de FCM del teléfono, para que los avisos de la alerta y de los traslados lleguen con la app
 * cerrada. Un teléfono nuevo reemplaza al anterior.
 */
export async function registrarDispositivo() {
  const Notifications = await cargarNotificaciones()
  if (!Notifications) {
    return
  }
  try {
    const token = await Notifications.getDevicePushTokenAsync()
    await notificacionesApi.registrarDispositivo({ tokenPush: String(token.data) })
  } catch {
    // Sin conexión o sin push: se vuelve a registrar la próxima vez que se abra la app.
  }
}

export async function actualizarTokenDelDispositivo(token: DevicePushToken) {
  try {
    await notificacionesApi.registrarDispositivo({ tokenPush: String(token.data) })
  } catch {
    // Se vuelve a registrar la próxima vez que se abra la app.
  }
}
