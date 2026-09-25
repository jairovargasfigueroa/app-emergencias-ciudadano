import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { trasladosApi, type DetallesTraslado, type PedirTraslado } from './api'

export const trasladosKeys = {
  todos: ['traslados'] as const,
  mios: () => [...trasladosKeys.todos, 'mios'] as const,
  centros: () => ['centros-salud'] as const,
}

/**
 * Los traslados del ciudadano. Se refresca solo cada medio minuto: mientras espera, lo que cambia es que el
 * sistema le asigne una unidad, y eso pasa del lado del servidor sin que él toque nada.
 */
export const misTrasladosQuery = () =>
  queryOptions({
    queryKey: trasladosKeys.mios(),
    queryFn: ({ signal }) => trasladosApi.mios(signal),
    refetchInterval: 30_000,
  })

/** Los centros de salud cambian muy de vez en cuando: no hace falta volver a pedirlos todo el tiempo. */
export const centrosSaludQuery = () =>
  queryOptions({
    queryKey: trasladosKeys.centros(),
    queryFn: ({ signal }) => trasladosApi.centrosSalud(signal),
    staleTime: 30 * 60_000,
  })

export const pedirTrasladoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (datos: PedirTraslado) => trasladosApi.pedir(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trasladosKeys.todos }),
  })

export const cancelarTrasladoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (trasladoId: number) => trasladosApi.cancelar(trasladoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trasladosKeys.todos }),
  })

/** Corregir la referencia, el contacto o las observaciones. Se puede hasta con la unidad en camino. */
export const actualizarDetallesMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, datos }: { id: number; datos: DetallesTraslado }) =>
      trasladosApi.actualizarDetalles(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trasladosKeys.todos }),
  })
