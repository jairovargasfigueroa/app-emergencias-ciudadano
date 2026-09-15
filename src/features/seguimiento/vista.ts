import { segundosDesde } from '@/shared/formato/tiempo'

import { esEstadoFinal, type EstadoAtencion, type EstadoIncidente, type Seguimiento } from './api'

/** Pantallas del seguimiento según ME-1 (PB-06, tabla de mapeo de estados). */
export type VistaSeguimiento =
  | { tipo: 'buscando' }
  | { tipo: 'acudiendo'; etapa: EstadoAtencion }
  | { tipo: 'concluido'; estado: EstadoIncidente }

const ORDEN_ETAPAS: EstadoAtencion[] = ['EN_CAMINO', 'EN_EL_LUGAR', 'PACIENTE_RECOGIDO']

/**
 * Estado final: concluido. Sin atenciones activas: buscando unidad, también cuando la única unidad canceló y el
 * incidente volvió a `ACTIVO` (R5). Con unidades: la etapa más avanzada entre todas las que acuden.
 */
export function vistaDeSeguimiento(seguimiento: Seguimiento | null): VistaSeguimiento {
  if (!seguimiento) {
    return { tipo: 'buscando' }
  }
  if (esEstadoFinal(seguimiento.estado)) {
    return { tipo: 'concluido', estado: seguimiento.estado }
  }
  if (seguimiento.unidades.length === 0) {
    return { tipo: 'buscando' }
  }
  const etapa = seguimiento.unidades.reduce<EstadoAtencion>(
    (masAvanzada, unidad) =>
      ORDEN_ETAPAS.indexOf(unidad.estado) > ORDEN_ETAPAS.indexOf(masAvanzada) ? unidad.estado : masAvanzada,
    'EN_CAMINO',
  )
  return { tipo: 'acudiendo', etapa }
}

/** Umbral de antigüedad de la posición (PB-06 R3). Se configura en .env.local. */
export const UMBRAL_POSICION_SEG = umbralDeEntorno(process.env.EXPO_PUBLIC_UMBRAL_POSICION_SEG)

/** PB-06 R3, CA-05 y CA-06: la posición está desactualizada si su antigüedad supera el umbral. */
export function posicionDesactualizada(en: string | undefined, ahora: number, umbralSeg: number = UMBRAL_POSICION_SEG) {
  return en !== undefined && segundosDesde(en, ahora) > umbralSeg
}

function umbralDeEntorno(valor: string | undefined) {
  const segundos = Number(valor)
  return valor && Number.isFinite(segundos) && segundos > 0 ? segundos : 60
}
