import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { guardarSesion, type Sesion } from '@/shared/sesion/almacen'
import { cerrarSesion, sesionKeys, sesionQuery } from '@/shared/sesion/queries'

import { guardarUltimoNumero, leerUltimoNumero } from './almacen'
import { accesoApi, type Ciudadano, type IngresoCiudadano } from './api'

export const accesoKeys = {
  ultimoNumero: ['acceso', 'ultimo-numero'] as const,
}

/** Ciudadano con sesión en este teléfono, o `null`: es la sesión guardada, vista desde el acceso. */
export const ciudadanoQuery = () =>
  queryOptions({
    ...sesionQuery<Ciudadano>(),
    select: (sesion) => sesion?.usuario ?? null,
  })

/** El último número con el que se entró en este teléfono, o `null`. Se lee del almacén local. */
export const ultimoNumeroQuery = () =>
  queryOptions({
    queryKey: accesoKeys.ultimoNumero,
    queryFn: leerUltimoNumero,
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: Infinity,
  })

/** El número queda recordado en el teléfono y en la consulta, para que la pantalla de ingreso lo muestre escrito. */
export function recordarUltimoNumero(queryClient: QueryClient, numero: string) {
  queryClient.setQueryData(accesoKeys.ultimoNumero, numero)
  return guardarUltimoNumero(numero)
}

/** Lo que va al servidor, más los 8 dígitos del número que se verificó. */
export type Ingreso = IngresoCiudadano & { numero: string }

/**
 * Entra con el número verificado. La sesión queda guardada con su vencimiento, igual que antes, y al ponerla en la
 * consulta el guard del router cambia solo a las pantallas de adentro.
 */
export const ingresarMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async ({ numero, ...datos }: Ingreso) => {
      const { token, venceEn, ciudadano } = await accesoApi.ingresar(datos)
      const sesion: Sesion<Ciudadano> = { token, venceEn, usuario: ciudadano }
      await guardarSesion(sesion)
      // Si el número no se pudo recordar, la próxima vez se escribe otra vez: no es motivo para no entrar.
      await recordarUltimoNumero(queryClient, numero).catch(() => {})
      return sesion
    },
    // Sin conexión falla enseguida y la pantalla ofrece reintentar. En pausa, un ingreso que la persona ya abandonó,
    // por ejemplo al cambiar el número, podría completarse solo cuando vuelva la señal.
    networkMode: 'always',
    onSuccess: (sesion) => {
      queryClient.setQueryData(sesionKeys.actual, sesion)
    },
  })

/** Cierra la sesión cuando el backend ya no reconoce al ciudadano: la app vuelve a la pantalla de ingreso. */
export function olvidarCiudadano(queryClient: QueryClient) {
  return cerrarSesion(queryClient)
}
