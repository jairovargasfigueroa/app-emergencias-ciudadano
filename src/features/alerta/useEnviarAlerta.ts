import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToastController } from 'tamagui'

import { ciudadanoQuery, olvidarCiudadano } from '@/features/registro/queries'
import { ErrorApi, mensajeDeError } from '@/shared/api/cliente'

import type { AlertaCreada, CrearAlerta, OrigenUbicacion } from './api'
import { camposOpcionales, leerDetallesAlerta, limpiarDetallesAlerta } from './detalles'
import { emitirAlertaMutation } from './queries'
import type { Coordenadas } from './ubicacion'

/**
 * Envía la alerta del ciudadano registrado con los detalles opcionales que haya escrito. Lo usan la pantalla del
 * botón (GPS) y la del pin manual (MANUAL, o GPS si vuelve a intentarlo).
 */
export function useEnviarAlerta(alEnviar: (alerta: AlertaCreada, datos: CrearAlerta) => void) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const ciudadano = useQuery(ciudadanoQuery()).data
  const emitir = useMutation(emitirAlertaMutation())

  function enviar(coordenadas: Coordenadas, origenUbicacion: OrigenUbicacion) {
    if (!ciudadano || emitir.isPending) {
      return
    }
    emitir.mutate(
      {
        ciudadanoId: ciudadano.id,
        datos: { ...coordenadas, origenUbicacion, ...camposOpcionales(leerDetallesAlerta()) },
      },
      {
        onSuccess: (alerta, { datos }) => {
          limpiarDetallesAlerta()
          alEnviar(alerta, datos)
        },
        onError: (error) => {
          if (error instanceof ErrorApi && error.status === 404) {
            // El backend ya no conoce al ciudadano guardado (R1: toda alerta tiene emisor): se pide el registro otra vez.
            void olvidarCiudadano(queryClient)
            toast.show('Necesitamos registrarte de nuevo', { message: 'Tu registro ya no existe en el sistema.' })
            return
          }
          toast.show('No se pudo enviar la alerta', { message: mensajeDeError(error) })
        },
      },
    )
  }

  return { enviar, enviando: emitir.isPending, esperandoConexion: emitir.isPaused }
}
