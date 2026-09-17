import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { borrarCiudadanoGuardado, guardarCiudadano, leerCiudadanoGuardado } from './almacen'
import { registroApi, type RegistrarCiudadano } from './api'

export const registroKeys = {
  ciudadano: ['ciudadano'] as const,
}

/** Ciudadano registrado en este teléfono, o `null`. Se lee del almacén local: no depende de la conexión. */
export const ciudadanoQuery = () =>
  queryOptions({
    queryKey: registroKeys.ciudadano,
    queryFn: leerCiudadanoGuardado,
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: Infinity,
  })

/** PB-02 R1: registro ligero. Al terminar, la app habilita el botón de alerta. */
export const registrarCiudadanoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (datos: RegistrarCiudadano) => {
      const ciudadano = await registroApi.registrar(datos)
      await guardarCiudadano(ciudadano)
      return ciudadano
    },
    onSuccess: (ciudadano) => {
      queryClient.setQueryData(registroKeys.ciudadano, ciudadano)
    },
  })

/** Borra el registro guardado cuando el backend ya no reconoce al ciudadano: la app vuelve a pedirlo. */
export async function olvidarCiudadano(queryClient: QueryClient) {
  await borrarCiudadanoGuardado()
  queryClient.setQueryData(registroKeys.ciudadano, null)
}
