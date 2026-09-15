import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Marker } from 'react-native-maps'
import { Text, YStack, useTheme } from 'tamagui'

import type { PosicionUnidad } from './api'

type Props = {
  placa: string
  posicion: PosicionUnidad
  desactualizada: boolean
}

/** Unidad en el mapa con su placa. Si la posición es vieja se atenúa, en lugar de fingir que es en vivo (R3). */
export function MarcadorUnidad({ placa, posicion, desactualizada }: Props) {
  const tema = useTheme()
  return (
    <Marker coordinate={{ latitude: posicion.latitud, longitude: posicion.longitud }} anchor={{ x: 0.5, y: 0.35 }}>
      <YStack items="center" gap={4} opacity={desactualizada ? 0.6 : 1}>
        <YStack width={40} height={40} rounded={12} bg={desactualizada ? '$textoSecundario' : '$texto'} items="center" justify="center">
          <MaterialCommunityIcons name="ambulance" size={22} color={tema.fondo?.val} />
        </YStack>
        <YStack px={6} py={2} rounded={6} bg="$superficie">
          <Text color="$texto" fontFamily="$mono" fontSize={11} fontWeight="500">
            {placa}
          </Text>
        </YStack>
      </YStack>
    </Marker>
  )
}

/** Punto desde donde el ciudadano pidió ayuda. */
export function MarcadorCiudadano({ latitud, longitud }: { latitud: number; longitud: number }) {
  return (
    <Marker coordinate={{ latitude: latitud, longitude: longitud }} anchor={{ x: 0.5, y: 0.5 }}>
      <YStack width={36} height={36} items="center" justify="center">
        <YStack position="absolute" width={36} height={36} rounded={999} bg="$primario" opacity={0.18} />
        <YStack width={16} height={16} rounded={999} bg="$primario" borderWidth={3} borderColor="#FFFFFF" />
      </YStack>
    </Marker>
  )
}
