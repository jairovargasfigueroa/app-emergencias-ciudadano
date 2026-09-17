import { router } from 'expo-router'

import type { SeguimientoGuardado } from './almacen'

/**
 * Ruta del seguimiento de un caso. La hora, la ubicación y los ids viajan como parámetros: la pantalla los muestra
 * mientras busca unidad, el mapa marca desde dónde se pidió ayuda y el `alertaId` sirve para completar los detalles.
 */
export function rutaDeSeguimiento(seguimiento: SeguimientoGuardado) {
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

export function abrirSeguimiento(seguimiento: SeguimientoGuardado, { reemplazar = false } = {}) {
  const destino = rutaDeSeguimiento(seguimiento)
  if (reemplazar) {
    router.replace(destino)
  } else {
    router.push(destino)
  }
}
