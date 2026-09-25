import type { EstadoTraslado, Movilidad, TipoUnidad } from './api'

/** Lo que el ciudadano lee, no lo que el sistema piensa: "sin unidad" no le dice nada a una familia. */
export const TEXTO_ESTADO: Record<EstadoTraslado, string> = {
  PROGRAMADO: 'Programado',
  BUSCANDO_UNIDAD: 'Buscando unidad',
  ASIGNADO: 'Confirmado',
  COMPLETADO: 'Completado',
  NO_REALIZADO: 'No se realizó',
  NO_CUBIERTO: 'No se pudo cubrir',
  CANCELADO: 'Cancelado',
}

export const EXPLICACION_ESTADO: Record<EstadoTraslado, string> = {
  PROGRAMADO: 'Ese día te asignamos una unidad y te avisamos a qué hora pasa.',
  BUSCANDO_UNIDAD: 'Estamos buscando una ambulancia. Te avisamos apenas la tengamos.',
  ASIGNADO: 'La unidad ya está asignada y va en camino.',
  COMPLETADO: 'El traslado se hizo.',
  NO_REALIZADO: 'La unidad fue, pero el traslado no se llegó a hacer.',
  NO_CUBIERTO: 'No conseguimos una unidad a tiempo. Lamentamos el problema.',
  CANCELADO: 'Retiraste este pedido.',
}

export const TEXTO_MOVILIDAD: Record<Movilidad, string> = {
  CAMINA_CON_AYUDA: 'Camina con ayuda',
  SILLA_DE_RUEDAS: 'Silla de ruedas',
  CAMILLA: 'Camilla',
}

export const DETALLE_MOVILIDAD: Record<Movilidad, string> = {
  CAMINA_CON_AYUDA: 'Se mueve por sus medios con apoyo.',
  SILLA_DE_RUEDAS: 'No camina, pero se mantiene sentado.',
  CAMILLA: 'No se levanta sin ayuda, no camina y no puede sentarse.',
}

export const TEXTO_TIPO_UNIDAD: Record<TipoUnidad, string> = {
  IA: 'Transporte simple',
  IB: 'Rescate',
  II: 'Soporte básico',
  III: 'Soporte avanzado',
}

export const DETALLE_TIPO_UNIDAD: Record<TipoUnidad, string> = {
  IA: 'Para quien camina o va en silla de ruedas. Sin equipo médico.',
  IB: 'Rescate y salvataje.',
  II: 'Camilla, oxígeno y dos paramédicos.',
  III: 'Monitor, medicación y vía, para quien necesita soporte durante el viaje.',
}
