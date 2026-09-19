import { queryOptions, type QueryClient } from '@tanstack/react-query'

import { borrarSesion, leerSesion } from './almacen'

export const sesionKeys = {
  actual: ['sesion'] as const,
}

/** Sesión abierta en este teléfono, o `null`. Se lee del almacén local: no depende de la conexión. */
export const sesionQuery = <T>() =>
  queryOptions({
    queryKey: sesionKeys.actual,
    queryFn: () => leerSesion<T>(),
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: Infinity,
  })

/** Cierra la sesión. El guard del router deja a la vista solo la pantalla de entrada. */
export async function cerrarSesion(queryClient: QueryClient) {
  // Primero la pantalla, después el almacén: nada espera al teléfono para reaccionar.
  queryClient.setQueryData(sesionKeys.actual, null)
  await borrarSesion()
}
