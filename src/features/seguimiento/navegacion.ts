import { router } from 'expo-router'

import type { AlertaCreada, CrearAlerta } from '@/features/alerta/api'

/**
 * Abre el seguimiento de la alerta recién emitida. La hora, la ubicación y los afectados viajan como parámetros:
 * la pantalla los muestra mientras busca unidad y el mapa marca desde dónde se pidió ayuda.
 */
export function abrirSeguimiento(alerta: AlertaCreada, datos: CrearAlerta, { reemplazar = false } = {}) {
  const destino = {
    pathname: '/seguimiento/[incidenteId]' as const,
    params: {
      incidenteId: String(alerta.incidenteId),
      enviadaEn: alerta.fechaHora,
      latitud: String(datos.latitud),
      longitud: String(datos.longitud),
      origen: datos.origenUbicacion,
      ...(datos.cantidadAfectados === undefined ? {} : { afectados: String(datos.cantidadAfectados) }),
    },
  }
  if (reemplazar) {
    router.replace(destino)
  } else {
    router.push(destino)
  }
}
