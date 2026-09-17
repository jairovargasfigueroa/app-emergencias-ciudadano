import { useLocalSearchParams } from 'expo-router'
import { Spinner, YStack } from 'tamagui'

import type { Coordenadas } from '@/features/alerta/ubicacion'

import { BuscandoUnidad } from './BuscandoUnidad'
import { SeguimientoConcluido } from './SeguimientoConcluido'
import { UnidadesAcudiendo } from './UnidadesAcudiendo'
import { useSeguimiento } from './useSeguimiento'
import { vistaDeSeguimiento } from './vista'

/** Datos de la alerta que llegan desde la pantalla que la emitió. Solo el id del incidente es obligatorio. */
export type ParametrosSeguimiento = {
  incidenteId: string
  enviadaEn?: string
  latitud?: string
  longitud?: string
  origen?: string
  afectados?: string
}

/** PB-06: qué pasa con la alerta, en tiempo real, desde que se emite hasta que el incidente se cierra. */
export function PantallaSeguimiento() {
  const parametros = useLocalSearchParams<ParametrosSeguimiento>()
  const { cargando, error, seguimiento } = useSeguimiento(Number(parametros.incidenteId))
  const vista = vistaDeSeguimiento(seguimiento)

  if (cargando) {
    return (
      <YStack flex={1} bg="$fondo" items="center" justify="center">
        <Spinner size="large" color="$primario" />
      </YStack>
    )
  }

  if (vista.tipo === 'concluido') {
    return <SeguimientoConcluido estado={vista.estado} />
  }

  if (vista.tipo === 'buscando' || !seguimiento) {
    return (
      <BuscandoUnidad
        enviadaEn={parametros.enviadaEn}
        origen={parametros.origen}
        afectados={parametros.afectados}
        sinTiempoReal={error}
      />
    )
  }

  return (
    <UnidadesAcudiendo
      unidades={seguimiento.unidades}
      etapa={vista.etapa}
      ubicacionCiudadano={coordenadasDeParametros(parametros.latitud, parametros.longitud)}
    />
  )
}

function coordenadasDeParametros(latitud?: string, longitud?: string): Coordenadas | null {
  const lat = Number(latitud)
  const lon = Number(longitud)
  return latitud && longitud && Number.isFinite(lat) && Number.isFinite(lon) ? { latitud: lat, longitud: lon } : null
}
