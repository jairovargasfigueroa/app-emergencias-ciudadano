import { queryOptions, type QueryClient } from '@tanstack/react-query'

import {
  borrarSeguimientoGuardado,
  guardarSeguimiento,
  leerSeguimientoGuardado,
  type SeguimientoGuardado,
} from './almacen'

export const seguimientoKeys = {
  enCurso: ['seguimiento', 'en-curso'] as const,
}

/** Caso abierto en este teléfono, o `null`. Se lee del almacén local: no depende de la conexión. */
export const seguimientoEnCursoQuery = () =>
  queryOptions({
    queryKey: seguimientoKeys.enCurso,
    queryFn: leerSeguimientoGuardado,
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: Infinity,
  })

/** Al emitir la alerta: el caso queda guardado para poder volver a él aunque se cierre la app. */
export function recordarSeguimiento(queryClient: QueryClient, seguimiento: SeguimientoGuardado) {
  queryClient.setQueryData(seguimientoKeys.enCurso, seguimiento)
  return guardarSeguimiento(seguimiento)
}

/** Los detalles de la alerta ya salieron: queda anotado en el caso guardado, si sigue siendo el de esa alerta. */
export async function recordarDetallesEnviados(queryClient: QueryClient, alertaId: number) {
  const enCurso = queryClient.getQueryData(seguimientoEnCursoQuery().queryKey) ?? (await leerSeguimientoGuardado())
  if (enCurso?.alertaId !== alertaId) {
    return
  }
  await recordarSeguimiento(queryClient, { ...enCurso, detallesEnviados: true })
}

/** PB-06 R4: el incidente llegó a un estado final, así que ya no hay caso al que volver. */
export async function olvidarSeguimiento(queryClient: QueryClient) {
  await borrarSeguimientoGuardado()
  queryClient.setQueryData(seguimientoKeys.enCurso, null)
}
