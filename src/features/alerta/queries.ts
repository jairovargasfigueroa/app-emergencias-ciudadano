import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { olvidarSeguimiento, recordarDetallesEnviados } from '@/features/seguimiento/queries'

import { alertaApi, type CrearAlerta, type DetallesAlerta, type RetirarPedido } from './api'
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

/** `POST /alertas`. Sin conexión, TanStack Query la deja en pausa y la envía cuando vuelve la señal. */
export const emitirAlertaMutation = () =>
  mutationOptions({
    mutationKey: ['alertas', 'emitir'],
    mutationFn: (datos: CrearAlerta) => alertaApi.emitir(datos),
  })

export type CompletarDetalles = {
  alertaId: number
  detalles: DetallesAlerta
}

/**
 * `POST /alertas/{alertaId}/detalles`, una sola vez con todo lo contestado. Al salir bien se anota en el caso guardado,
 * aunque la pantalla ya no esté, para que al reabrir la app no se pregunte ni se envíe otra vez.
 */
export const completarDetallesMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: ['alertas', 'detalles'],
    mutationFn: ({ alertaId, detalles }: CompletarDetalles) => alertaApi.completarDetalles(alertaId, detalles),
    onSuccess: (_alerta, { alertaId }) => {
      // Sin esperar ni propagar: si el teléfono no logra guardarlo, el envío igual salió bien.
      recordarDetallesEnviados(queryClient, alertaId).catch(() => {})
    },
  })

export type RetirarPedidoDeAlerta = {
  alertaId: number
  datos: RetirarPedido
}

/**
 * `POST /alertas/{alertaId}/cancelacion`. Retirar el pedido no siempre cierra el incidente: si otro también avisó, o si
 * ya hay una unidad en camino, sigue y lo resuelve quien corresponde. Para este teléfono, en cambio, el caso termina:
 * se olvida aunque la pantalla ya no esté, para que el inicio vuelva a ofrecer el botón de ayuda.
 */
export const retirarPedidoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationKey: ['alertas', 'retiro'],
    mutationFn: ({ alertaId, datos }: RetirarPedidoDeAlerta) => alertaApi.retirar(alertaId, datos),
    onSuccess: () => {
      // Sin esperar ni propagar: si el teléfono no logra borrarlo, el retiro igual salió bien.
      olvidarSeguimiento(queryClient).catch(() => {})
    },
  })
