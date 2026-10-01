import { isRunningInExpoGo } from 'expo'
import { router } from 'expo-router'
import type { DevicePushToken, Notification, NotificationResponse } from 'expo-notifications'
import { Platform } from 'react-native'

import { abrirSeguimiento, volverAlInicio } from '@/features/seguimiento/navegacion'
import { seguimientoEnCursoQuery } from '@/features/seguimiento/queries'
import { trasladosKeys } from '@/features/traslados/queries'
import { queryClient } from '@/shared/query/queryClient'

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
  moduloNotificaciones ??= pushDisponible
    ? import('expo-notifications')
        .then((Notifications) => {
          Notifications.setNotificationHandler({
            // Con la app abierta el aviso se muestra igual, con banner y sonido, para que no pase desapercibido.
            handleNotification: async () => ({
              shouldShowBanner: true,
              shouldShowList: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            }),
          })
          return Notifications
        })
        .catch(() => null)
    : Promise.resolve(null)
  return moduloNotificaciones
}

/** Qué hacer con el permiso al arrancar con sesión: registrar el teléfono, preguntar si quiere avisos, o nada. */
export type PermisoDeAvisos = 'concedido' | 'preguntar' | 'no'

/**
 * Deja listo el canal de Android y dice qué hacer con el permiso. Se pregunta una sola vez: al terminar el registro o,
 * si ya estaba registrado, la primera vez que la app arranca con sesión. Nunca al pedir ayuda.
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
    // Android deja pedirlo otra vez después de un primer no: por eso lo que ya se preguntó queda anotado aparte.
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

/** Lo más que se espera al servidor al cerrar sesión: salir no puede quedar trabado por la conexión. */
const ESPERA_MAXIMA_AL_SALIR_MS = 2000

/**
 * Al cerrar sesión, el teléfono deja de recibir los avisos de esta cuenta: puede quedar en manos de otra persona de la
 * familia. Va antes de borrar la sesión, porque el servidor reconoce la cuenta por su token. Es de mejor esfuerzo: si
 * falla o tarda más de un par de segundos, la sesión se cierra igual.
 */
export async function dejarDeRecibirAvisos() {
  const cancelar = new AbortController()
  const plazo = setTimeout(() => cancelar.abort(), ESPERA_MAXIMA_AL_SALIR_MS)
  try {
    await notificacionesApi.quitarDispositivo(cancelar.signal)
  } catch {
    // Sin conexión, sin respuesta a tiempo o una cuenta que el servidor ya no reconoce: se sale igual.
  } finally {
    clearTimeout(plazo)
  }
}

/**
 * Al cerrar sesión se quitan de la bandeja los avisos que ya llegaron: son de la alerta y de los traslados de esa
 * cuenta, y quien use el teléfono después no tiene por qué verlos ni tocarlos.
 */
export async function quitarAvisosDeLaBandeja() {
  const Notifications = await cargarNotificaciones()
  try {
    await Notifications?.dismissAllNotificationsAsync()
  } catch {
    // Si el sistema no los deja quitar, quedan en la bandeja: la sesión se cierra igual.
  }
}

/** Los ids llegan en `data` como texto. */
function idDe(valor: unknown): string | null {
  return typeof valor === 'string' || typeof valor === 'number' ? String(valor) : null
}

/**
 * Al inicio desde donde esté la app. Desde el seguimiento, que queda como única pantalla, o desde algo apilado sobre
 * las pestañas, llega `volverAlInicio`. Parada en otra pestaña no hay nada que cerrar, así que se cambia de pestaña.
 */
function irAlInicio(rutaActual: string) {
  if (rutaActual === '/') {
    return
  }
  if (rutaActual.startsWith('/seguimiento/') || router.canDismiss()) {
    volverAlInicio()
  } else {
    router.navigate('/')
  }
}

/**
 * Aviso de una alerta: le llega a cada persona que avisó del incidente, con su propia alerta, y `tipo` dice qué pasó
 * (UNIDAD_EN_CAMINO, UNIDAD_LLEGO, BUSCANDO_OTRA_UNIDAD o CERRADO_POR_LA_CENTRAL). Abre el seguimiento si es el caso
 * que la app está siguiendo; si el caso ya terminó o la app no lo reconoce, va al inicio.
 */
function abrirAvisoDeAlerta(incidenteId: string, alertaId: string, rutaActual: string) {
  // Ese seguimiento ya está a la vista: sigue en vivo o, si el caso terminó, muestra el cierre. Abrirlo otra vez
  // perdería lo que la persona estaba contestando.
  if (rutaActual === `/seguimiento/${incidenteId}`) {
    return
  }
  const enCurso = queryClient.getQueryData(seguimientoEnCursoQuery().queryKey)
  if (enCurso == null || String(enCurso.alertaId) !== alertaId) {
    irAlInicio(rutaActual)
    return
  }
  // Parada en el inicio no se navega: el inicio abre solo el caso guardado, y abrirlo también desde acá sería una
  // segunda navegación. Es lo que pasa cuando el toque abre la app.
  if (rutaActual !== '/') {
    abrirSeguimiento(enCurso)
  }
}

/**
 * Aviso de un traslado: le llega a quien lo pidió, y `tipo` dice qué pasó (UNIDAD_ASIGNADA, UNIDAD_EN_LA_PUERTA,
 * NUEVA_BUSQUEDA, NO_CUBIERTO o RECORDATORIO). El traslado cambió en el servidor: se vuelve a pedir la lista, para que
 * el estado nuevo se vea sin tirar para refrescar. Devuelve el id si el aviso era de un traslado.
 */
function actualizarPorTraslado(datos: Record<string, unknown> | undefined) {
  const trasladoId = idDe(datos?.trasladoId)
  if (trasladoId !== null) {
    void queryClient.invalidateQueries({ queryKey: trasladosKeys.mios() })
  }
  return trasladoId
}

/** Aviso que llega con la app abierta. Lo muestra el sistema; acá se refresca lo que cambió. */
export function recibirAviso(notificacion: Notification) {
  actualizarPorTraslado(notificacion.request.content.data)
}

/** El aviso que abrió la app se vuelve a leer si el hook se monta otra vez: cada toque se atiende una sola vez. */
const respuestasAtendidas = new Set<string>()

/**
 * Al tocar un aviso se abre lo que avisa. `rutaActual` es la pantalla a la vista: la que ya se ve no se vuelve a
 * abrir.
 */
export function abrirAviso(respuesta: NotificationResponse, rutaActual: string) {
  const identificador = respuesta.notification.request.identifier
  if (respuestasAtendidas.has(identificador)) {
    return
  }
  respuestasAtendidas.add(identificador)
  const datos = respuesta.notification.request.content.data
  const trasladoId = actualizarPorTraslado(datos)
  if (trasladoId !== null) {
    // Con su detalle ya a la vista basta el refresco.
    if (rutaActual !== `/traslado/${trasladoId}`) {
      router.push({ pathname: '/traslado/[trasladoId]', params: { trasladoId } })
    }
    return
  }
  const incidenteId = idDe(datos?.incidenteId)
  const alertaId = idDe(datos?.alertaId)
  if (incidenteId !== null && alertaId !== null) {
    abrirAvisoDeAlerta(incidenteId, alertaId, rutaActual)
  }
}
