import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import type { Sesion } from '@/shared/sesion/almacen'
import { sesionQuery } from '@/shared/sesion/queries'
import { venceEnMs } from '@/shared/sesion/vencimiento'

import type { Ciudadano } from './api'
import { esNumeroValido, numeroNacional } from './numero'
import { recordarUltimoNumero, renovarSesionMutation, ultimoNumeroQuery } from './queries'

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
 * Las sesiones abiertas antes del ingreso por SMS no dejaron recordado su número. Se toma el de la cuenta, para que la
 * pantalla de ingreso lo muestre escrito si esta sesión se cierra, por ejemplo porque ya no se puede renovar.
 */
async function recordarNumeroDeLaCuenta(queryClient: QueryClient, telefono: string) {
  if (await queryClient.ensureQueryData(ultimoNumeroQuery())) {
    return
  }
  // Esas cuentas guardaban el teléfono tal como se escribió: solo sirve si son los 8 dígitos de un celular.
  const numero = numeroNacional(telefono)
  if (esNumeroValido(numero)) {
    await recordarUltimoNumero(queryClient, numero)
  }
}

/**
 * Al abrir la app con sesión: si al token le quedan menos de 30 días, se renueva por detrás, sin trabar la pantalla.
 * Si falla por red, no pasa nada y se intenta en el próximo arranque. Si el servidor ya no la renueva, responde 401, el
 * manejador global cierra la sesión y la pantalla de ingreso aparece con el número escrito.
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
    const conLaQueArranco = sesion.data
    if (!conLaQueArranco) {
      return
    }
    void (async () => {
      // Primero el número: si la renovación termina en 401, la pantalla de ingreso ya lo encuentra.
      await recordarNumeroDeLaCuenta(queryClient, conLaQueArranco.usuario.telefono).catch(() => {})
      if (quedaPocoParaVencer(conLaQueArranco)) {
        renovar(conLaQueArranco.token)
      }
    })()
  }, [sesion.isPending, sesion.data, queryClient, renovar])
}
