import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Text, XStack, YStack, useTheme } from 'tamagui'

import { haceCuanto, segundosDesde } from '@/shared/formato/tiempo'
import { Insignia, type TonoInsignia } from '@/shared/ui/Insignia'

import type { EstadoAtencion, UnidadSeguimiento } from './api'
import { posicionDesactualizada } from './vista'

const ESTADOS: Record<EstadoAtencion, { texto: string; tono: TonoInsignia }> = {
  EN_CAMINO: { texto: 'En camino', tono: 'ambar' },
  EN_EL_LUGAR: { texto: 'En el lugar', tono: 'verde' },
  PACIENTE_RECOGIDO: { texto: 'Paciente recogido', tono: 'verde' },
}

/** PB-06 CA-03 y CA-05: cada unidad con su estado y qué tan reciente es su posición. */
export function TarjetaUnidad({ unidad, ahora }: { unidad: UnidadSeguimiento; ahora: number }) {
  const tema = useTheme()
  const estado = ESTADOS[unidad.estado]
  const enPosicion = unidad.posicion?.en
  const desactualizada = posicionDesactualizada(enPosicion, ahora)
  const detalle = !unidad.posicion
    ? 'Sin posición todavía'
    : enPosicion && !desactualizada
      ? `Actualizado ${haceCuanto(segundosDesde(enPosicion, ahora))}`
      : 'Posición recibida'

  return (
    <YStack gap={10} p={14} rounded={14} borderWidth={1} borderColor="$borde" bg="$superficie">
      <XStack items="center" gap={14}>
        <YStack width={44} height={44} shrink={0} rounded={12} bg="$fondo" items="center" justify="center">
          <MaterialCommunityIcons name="ambulance" size={22} color={tema.texto?.val} />
        </YStack>
        <YStack flex={1} minW={0} gap={2}>
          <Text color="$texto" fontFamily="$mono" fontSize={15} fontWeight="500">
            {unidad.placa}
          </Text>
          <Text color="$textoSecundario" fontSize={13}>
            {desactualizada ? 'Sin actualizaciones recientes' : detalle}
          </Text>
        </YStack>
        <Insignia tono={estado.tono} conPunto>
          {estado.texto}
        </Insignia>
      </XStack>
      {desactualizada && enPosicion ? (
        <XStack items="center" gap={8} px={10} py={8} rounded={10} bg="$enAtencionTinte">
          <Feather name="clock" size={16} color={tema.enAtencionTexto?.val} />
          <Text color="$enAtencionTexto" fontSize={13} lineHeight={18}>
            {`Última posición recibida ${haceCuanto(segundosDesde(enPosicion, ahora))}`}
          </Text>
        </XStack>
      ) : null}
    </YStack>
  )
}
