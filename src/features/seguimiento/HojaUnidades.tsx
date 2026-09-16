import { H1, Text, YStack } from 'tamagui'

import type { EstadoAtencion, UnidadSeguimiento } from './api'
import { TarjetaUnidad } from './TarjetaUnidad'

type Props = {
  unidades: UnidadSeguimiento[]
  etapa: EstadoAtencion
  ahora: number
}

function encabezado(etapa: EstadoAtencion, unidades: UnidadSeguimiento[]) {
  if (etapa === 'PACIENTE_RECOGIDO') {
    return { titulo: 'Paciente recogido', detalle: 'Van camino al centro de salud.' }
  }
  if (etapa === 'EN_EL_LUGAR') {
    const llego = unidades.find((unidad) => unidad.estado === 'EN_EL_LUGAR')
    return { titulo: 'En el lugar', detalle: `La unidad ${llego?.placa ?? ''} llegó a tu ubicación.` }
  }
  return {
    titulo: 'La ayuda está en camino',
    detalle: unidades.length === 1 ? '1 unidad acude a tu alerta' : `${unidades.length} unidades acuden a tu alerta`,
  }
}

/** PB-06 CA-02 a CA-04: todas las unidades que acuden, con su estado y qué tan reciente es su posición. */
export function HojaUnidades({ unidades, etapa, ahora }: Props) {
  const { titulo, detalle } = encabezado(etapa, unidades)

  return (
    <YStack gap={14}>
      <YStack gap={4}>
        <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
          {titulo}
        </H1>
        <Text color="$textoSecundario" fontSize={15}>
          {detalle}
        </Text>
      </YStack>
      <YStack gap={10}>
        {unidades.map((unidad) => (
          <TarjetaUnidad key={unidad.ambulanciaId} unidad={unidad} ahora={ahora} />
        ))}
      </YStack>
    </YStack>
  )
}
