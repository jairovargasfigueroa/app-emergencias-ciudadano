import { router } from 'expo-router'

import type { SeguimientoGuardado } from './almacen'

/**
 * Ruta del seguimiento de un caso. La hora, la ubicación y los ids viajan como parámetros: la pantalla los muestra
 * mientras busca unidad, el mapa marca desde dónde se pidió ayuda y el `alertaId` sirve para completar los detalles.
 */
function rutaDeSeguimiento(seguimiento: SeguimientoGuardado) {
  return {
    pathname: '/seguimiento/[incidenteId]' as const,
    params: {
      incidenteId: String(seguimiento.incidenteId),
      alertaId: String(seguimiento.alertaId),
      enviadaEn: seguimiento.enviadaEn,
      latitud: String(seguimiento.latitud),
      longitud: String(seguimiento.longitud),
      origen: seguimiento.origen,
    },
  }
}

/**
 * PB-06: el seguimiento reemplaza al inicio en vez de apilarse, así que volver atrás no devuelve al botón. Queda como
 * la única pantalla: si la alerta salió desde el pin, también se van el pin y el inicio que estaba debajo.
 */
export function abrirSeguimiento(seguimiento: SeguimientoGuardado) {
  if (router.canDismiss()) {
    router.dismissAll()
  }
  router.replace(rutaDeSeguimiento(seguimiento))
}

/**
 * Del seguimiento cerrado al botón de ayuda. Como el seguimiento es la única pantalla, dismissTo pone un inicio nuevo
 * en su lugar; si hubiera uno debajo, vuelve a ese en vez de apilar otro.
 */
export function volverAlInicio() {
  router.dismissTo('/')
}
