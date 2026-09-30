import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import type { Sesion } from '@/shared/sesion/almacen'
import { sesionQuery } from '@/shared/sesion/queries'
import { venceEnMs } from '@/shared/sesion/vencimiento'

import type { Ciudadano } from './api'
import { renovarSesionMutation } from './queries'

/** Con menos de este margen, el token se cambia por uno nuevo al abrir la app. */
const MARGEN_PARA_RENOVAR_MS = 30 * 24 * 60 * 60 * 1000

/** La sesión se revisa una sola vez por arranque de la app, aunque el layout se vuelva a montar. */
let revisadaEnEsteArranque = false

/** Si no se sabe cuándo vence, no se renueva: si ya no vale, el primer 401 cierra la sesión igual. */
function quedaPocoParaVencer(sesion: Sesion<Ciudadano>) {
  const vence = venceEnMs(sesion)
  return vence !== null && vence - Date.now() < MARGEN_PARA_RENOVAR_MS
}

/**
 * Al abrir la app con sesión: si al token le quedan menos de 30 días, se renueva por detrás, sin trabar la pantalla.
 * Si falla por red, no pasa nada y se intenta en el próximo arranque. Si el servidor ya no la renueva, responde 401 y el
 * manejador global cierra la sesión.
 */
export function useRevisarSesionAlAbrir() {
  const queryClient = useQueryClient()
  const sesion = useQuery(sesionQuery<Ciudadano>())
  const { mutate: renovar } = useMutation(renovarSesionMutation(queryClient))

  useEffect(() => {
    // Se mira la sesión con la que arrancó la app: una que se abre después, al entrar, es nueva y no hace falta.
    if (sesion.isPending || revisadaEnEsteArranque) {
      return
    }
    revisadaEnEsteArranque = true
    if (sesion.data && quedaPocoParaVencer(sesion.data)) {
      renovar(sesion.data.token)
    }
  }, [sesion.isPending, sesion.data, renovar])
}
