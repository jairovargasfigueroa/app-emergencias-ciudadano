import { useEffect, useState } from 'react'

import {
  activarAvisos,
  actualizarTokenDelDispositivo,
  cargarNotificaciones,
  descartarAvisos,
  prepararAvisos,
  registrarDispositivo,
} from './notificaciones'

/**
 * Con el permiso dado, registra el teléfono en cada arranque con sesión, sin preguntar nada, y sigue los cambios de
 * token. Si todavía no se le preguntó, `preguntar` abre la hoja que explica para qué son los avisos. Donde no hay push
 * (Expo Go para Android) no hace nada.
 */
export function useNotificaciones(ciudadanoId: number) {
  const [preguntar, setPreguntar] = useState(false)

  useEffect(() => {
    let activo = true
    const suscripciones: { remove: () => void }[] = []

    void cargarNotificaciones().then(async (Notifications) => {
      if (!Notifications || !activo) {
        return
      }
      suscripciones.push(
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
