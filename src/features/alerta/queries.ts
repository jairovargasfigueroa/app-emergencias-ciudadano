import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { alertaApi, type CrearAlerta } from './api'
import { consultarEstadoGps } from './ubicacion'

export const alertaKeys = {
  estadoGps: ['gps'] as const,
}

/** Permiso y GPS del teléfono. Se vuelve a consultar al regresar a la app, por si el ciudadano los activó. */
export const estadoGpsQuery = () =>
  queryOptions({
    queryKey: alertaKeys.estadoGps,
    queryFn: consultarEstadoGps,
    networkMode: 'always',
    staleTime: 0,
    retry: false,
  })

export type EmitirAlerta = {
  ciudadanoId: number
  datos: CrearAlerta
}

/** `POST /alertas`. Sin conexión, TanStack Query la deja en pausa y la envía cuando vuelve la señal. */
export const emitirAlertaMutation = () =>
  mutationOptions({
    mutationKey: ['alertas', 'emitir'],
    mutationFn: ({ ciudadanoId, datos }: EmitirAlerta) => alertaApi.emitir(ciudadanoId, datos),
  })
