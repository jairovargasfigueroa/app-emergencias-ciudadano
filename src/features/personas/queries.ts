import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { personasApi, type RegistrarPersona } from './api'

export const personasKeys = {
  todas: ['personas'] as const,
  lista: () => [...personasKeys.todas, 'lista'] as const,
}

export const personasQuery = () =>
  queryOptions({
    queryKey: personasKeys.lista(),
    queryFn: ({ signal }) => personasApi.mias(signal),
  })

export const registrarPersonaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (datos: RegistrarPersona) => personasApi.registrar(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: personasKeys.todas }),
  })

export const olvidarPersonaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (personaId: number) => personasApi.olvidar(personaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: personasKeys.todas }),
  })
