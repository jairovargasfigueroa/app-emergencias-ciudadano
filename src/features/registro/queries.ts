import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { guardarSesion } from '@/shared/sesion/almacen'
import { cerrarSesion, sesionKeys, sesionQuery } from '@/shared/sesion/queries'

import { registroApi, type Ciudadano, type RegistrarCiudadano } from './api'

/** Ciudadano registrado en este teléfono, o `null`: es la sesión guardada, vista desde el registro. */
export const ciudadanoQuery = () =>
  queryOptions({
    ...sesionQuery<Ciudadano>(),
    select: (sesion) => sesion?.usuario ?? null,
  })

/** PB-02 R1: registro ligero. Al terminar, la app queda con sesión y habilita el botón de alerta. */
export const registrarCiudadanoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (datos: RegistrarCiudadano) => {
      const { token, ciudadano } = await registroApi.registrar(datos)
      const sesion = { token, usuario: ciudadano }
      await guardarSesion(sesion)
      return sesion
    },
    onSuccess: (sesion) => {
      queryClient.setQueryData(sesionKeys.actual, sesion)
    },
  })

/** Cierra la sesión cuando el backend ya no reconoce al ciudadano: la app vuelve a pedir el registro. */
export function olvidarCiudadano(queryClient: QueryClient) {
  return cerrarSesion(queryClient)
}
