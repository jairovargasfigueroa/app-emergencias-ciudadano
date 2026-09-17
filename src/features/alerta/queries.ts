import { mutationOptions, queryOptions } from '@tanstack/react-query'

import { alertaApi, type CrearAlerta, type DetallesAlerta } from './api'
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

export type CompletarDetalles = {
  ciudadanoId: number
  alertaId: number
  detalles: DetallesAlerta
}

/**
 * `POST /alertas/{alertaId}/detalles`. El mismo `scope` en todas las respuestas las pone en fila: si el ciudadano
 * contesta dos cosas seguidas, la última no adelanta a la anterior.
 */
export const completarDetallesMutation = () =>
  mutationOptions({
    mutationKey: ['alertas', 'detalles'],
    scope: { id: 'alerta-detalles' },
    mutationFn: ({ ciudadanoId, alertaId, detalles }: CompletarDetalles) =>
      alertaApi.completarDetalles(ciudadanoId, alertaId, detalles),
  })
