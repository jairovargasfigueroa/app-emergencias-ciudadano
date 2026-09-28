import { diaNatural, horaCorta } from '@/shared/formato/tiempo'
import type { TonoInsignia } from '@/shared/ui/Insignia'

import {
  trasladoVigente,
  unidadYaLlego,
  type EstadoTraslado,
  type EstadoUnidad,
  type Movilidad,
  type TipoUnidad,
  type Traslado,
} from './api'

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

export const TONO_ESTADO: Record<EstadoTraslado, TonoInsignia> = {
  PROGRAMADO: 'gris',
  BUSCANDO_UNIDAD: 'ambar',
  ASIGNADO: 'verde',
  COMPLETADO: 'gris',
  NO_REALIZADO: 'gris',
  NO_CUBIERTO: 'ambar',
  CANCELADO: 'gris',
}

/** Todavía no hay notificaciones: nada de "te avisamos". Lo cierto es que el estado se ve acá. */
export const EXPLICACION_ESTADO: Record<EstadoTraslado, string> = {
  PROGRAMADO: 'Ese día te asignamos una unidad. Revisa aquí el estado.',
  BUSCANDO_UNIDAD: 'Estamos buscando una ambulancia. Revisa aquí el estado.',
  ASIGNADO: 'Ya hay una unidad asignada a este traslado.',
  COMPLETADO: 'El traslado se hizo.',
  NO_REALIZADO: 'La unidad fue, pero el traslado no se llegó a hacer.',
  NO_CUBIERTO: 'No conseguimos una unidad a tiempo. Lamentamos el problema.',
  CANCELADO: 'Retiraste este pedido.',
}

/**
 * En qué va la unidad, dicho como lo diría la central. Solo mientras trabaja: cuando termina, lo que pasó ya lo
 * dice el estado del traslado.
 */
export const TEXTO_ESTADO_UNIDAD: Partial<Record<EstadoUnidad, string>> = {
  EN_CAMINO: 'La unidad va en camino',
  EN_EL_LUGAR: 'La unidad llegó',
  PACIENTE_RECOGIDO: 'En viaje al destino',
  EN_HOSPITAL: 'Llegaron al destino',
}

/**
 * Una ventana y no una hora exacta: hay un margen que el tráfico se come, y prometer "9:12" es prometer un minuto
 * que nadie puede sostener. Las horas son las de recogida, que es lo que le importa a la familia: la unidad tarda
 * en llegar a la puerta después de salir. Si la ventana cae dentro del mismo minuto, va una sola hora.
 *
 * Se promete desde que se pide, aunque el traslado sea para dentro de tres días: con eso la familia se organiza.
 * Deja de decirse cuando ya no sirve, porque el traslado terminó o la unidad ya está en la puerta. Siempre es la
 * que manda el servidor: si una unidad devuelve el traslado, la ventana puede correrse. Con `conDia` dice también
 * el día cuando no es hoy, para donde no hay nada alrededor que lo diga.
 */
export function ventanaDeRecogida(traslado: Traslado, { conDia = false } = {}): string | null {
  if (!traslado.horaRecogidaDesde || !traslado.horaRecogidaHasta) {
    return null
  }
  if (!trasladoVigente(traslado.estado) || unidadYaLlego(traslado)) {
    return null
  }
  // El comienzo ya pasó: decir "entre 09:00 y 09:40" a las 09:30 suena a que se atrasaron cuando no es así.
  if (new Date(traslado.horaRecogidaDesde).getTime() < Date.now()) {
    const dia = conDia ? diaEnLaFrase(traslado.horaRecogidaHasta) : ''
    return `Pasamos a recogerlo${dia} antes de las ${horaCorta(traslado.horaRecogidaHasta)}`
  }
  const dia = conDia ? diaEnLaFrase(traslado.horaRecogidaDesde) : ''
  const desde = horaCorta(traslado.horaRecogidaDesde)
  const hasta = horaCorta(traslado.horaRecogidaHasta)
  return desde === hasta
    ? `Pasamos a recogerlo${dia} cerca de las ${desde}`
    : `Pasamos a recogerlo${dia} entre ${desde} y ${hasta}`
}

/** " mañana" o " el jueves 2": el día dicho dentro de una frase. Hoy no se dice, se entiende solo. */
function diaEnLaFrase(iso: string) {
  const dia = diaNatural(iso)
  if (dia === 'Hoy') {
    return ''
  }
  if (dia === 'Mañana' || dia === 'Ayer') {
    return ` ${dia.toLowerCase()}`
  }
  const fecha = new Date(iso)
  return ` el ${fecha.toLocaleDateString('es-BO', { weekday: 'long' })} ${fecha.getDate()}`
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
