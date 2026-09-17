import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToastController } from 'tamagui'

import { ciudadanoQuery, olvidarCiudadano } from '@/features/registro/queries'
import type { SeguimientoGuardado } from '@/features/seguimiento/almacen'
import { recordarSeguimiento } from '@/features/seguimiento/queries'
import { ErrorApi, mensajeDeError } from '@/shared/api/cliente'

import type { OrigenUbicacion } from './api'
import { emitirAlertaMutation } from './queries'
import type { Coordenadas } from './ubicacion'

/** Un envío tal como salió: "Reintentar" lo repite igual. */
type Envio = {
  coordenadas: Coordenadas
  origenUbicacion: OrigenUbicacion
}

/**
 * Envía la alerta del ciudadano registrado. Lo usan la pantalla del botón (GPS) y la del pin manual (MANUAL, o GPS si
 * vuelve a intentarlo). PB-02 R3: sale solo con la ubicación; los detalles se preguntan después, ya en el seguimiento.
 */
export function useEnviarAlerta(alEnviar: (seguimiento: SeguimientoGuardado) => void) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const ciudadano = useQuery(ciudadanoQuery()).data
  const emitir = useMutation(emitirAlertaMutation())
  // Envío que el servidor rechazó: su aviso queda fijo hasta que el reintento salga bien o empiece un intento nuevo.
  const [rechazado, setRechazado] = useState<Envio | null>(null)

  function mandar(envio: Envio) {
    if (!ciudadano || emitir.isPending) {
      return
    }
    emitir.mutate(
      { ciudadanoId: ciudadano.id, datos: { ...envio.coordenadas, origenUbicacion: envio.origenUbicacion } },
      {
        onSuccess: (alerta, { datos }) => {
          setRechazado(null)
          const enCurso: SeguimientoGuardado = {
            incidenteId: alerta.incidenteId,
            alertaId: alerta.alertaId,
            enviadaEn: alerta.fechaHora,
            latitud: datos.latitud,
            longitud: datos.longitud,
            origen: datos.origenUbicacion,
          }
          // El caso queda en el teléfono antes de navegar: si la app se cierra, el ciudadano vuelve a él.
          void recordarSeguimiento(queryClient, enCurso)
          alEnviar(enCurso)
        },
        onError: (error) => {
          if (error instanceof ErrorApi && error.status === 404) {
            // El backend ya no conoce al ciudadano guardado (R1: toda alerta tiene emisor): se pide el registro otra vez.
            void olvidarCiudadano(queryClient)
            toast.show('Necesitamos registrarte de nuevo', { message: 'Tu registro ya no existe en el sistema.' })
            return
          }
          if (error instanceof ErrorApi && error.status === 0) {
            // Sin conexión con el servidor se avisa como siempre.
            toast.show('No se pudo enviar la alerta', { message: mensajeDeError(error) })
            return
          }
          setRechazado(envio)
        },
      },
    )
  }

  /** Empieza un intento nuevo: el aviso del envío anterior deja de valer. */
  function empezarIntento() {
    setRechazado(null)
  }

  function enviar(coordenadas: Coordenadas, origenUbicacion: OrigenUbicacion) {
    empezarIntento()
    mandar({ coordenadas, origenUbicacion })
  }

  /** Reenvía con las mismas coordenadas y el mismo origen del envío rechazado. */
  function reintentar() {
    if (rechazado) {
      mandar(rechazado)
    }
  }

  return {
    enviar,
    empezarIntento,
    reintentar,
    enviando: emitir.isPending,
    esperandoConexion: emitir.isPaused,
    // En pausa por falta de señal manda el aviso de conexión: la alerta sale sola cuando vuelve.
    rechazada: rechazado !== null && !emitir.isPaused,
  }
}
