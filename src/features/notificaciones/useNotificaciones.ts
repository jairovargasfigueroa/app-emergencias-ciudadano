import { usePathname } from 'expo-router'
import { useEffect, useRef, useState } from 'react'

import {
  abrirAviso,
  activarAvisos,
  actualizarTokenDelDispositivo,
  cargarNotificaciones,
  descartarAvisos,
  prepararAvisos,
  recibirAviso,
  registrarDispositivo,
} from './notificaciones'

/**
 * Con el permiso dado, registra el teléfono en cada arranque con sesión, sin preguntar nada, y sigue los cambios de
 * token. Al tocar un aviso abre lo que avisa; con la app abierta, un aviso de traslado además refresca la lista. Si
 * todavía no se le preguntó, `preguntar` abre la hoja que explica para qué son los avisos. Donde no hay push (Expo Go
 * para Android) no hace nada.
 */
export function useNotificaciones(ciudadanoId: number) {
  const ruta = usePathname()
  // La pantalla a la vista cuando se toca un aviso: la que ya se ve no se vuelve a abrir.
  const rutaActual = useRef(ruta)
  const [preguntar, setPreguntar] = useState(false)

  useEffect(() => {
    rutaActual.current = ruta
  }, [ruta])

  useEffect(() => {
    let activo = true
    const suscripciones: { remove: () => void }[] = []

    void cargarNotificaciones().then(async (Notifications) => {
      if (!Notifications || !activo) {
        return
      }
      // La app se abrió con el toque de un aviso.
      const ultimaRespuesta = Notifications.getLastNotificationResponse()
      if (ultimaRespuesta && ultimaRespuesta.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        abrirAviso(ultimaRespuesta, rutaActual.current)
      }

      suscripciones.push(
        Notifications.addNotificationReceivedListener(recibirAviso),
        Notifications.addNotificationResponseReceivedListener((respuesta) => {
          if (respuesta.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
            abrirAviso(respuesta, rutaActual.current)
          }
        }),
        Notifications.addPushTokenListener((token) => {
          void actualizarTokenDelDispositivo(token)
        }),
      )

      const permiso = await prepararAvisos()
      if (!activo) {
        return
      }
      if (permiso === 'concedido') {
        void registrarDispositivo()
      } else if (permiso === 'preguntar') {
        setPreguntar(true)
      }
    })

    return () => {
      activo = false
      suscripciones.forEach((suscripcion) => suscripcion.remove())
    }
  }, [ciudadanoId])

  function activar() {
    setPreguntar(false)
    void activarAvisos()
  }

  function descartar() {
    setPreguntar(false)
    void descartarAvisos()
  }

  return { preguntar, activar, descartar }
}
