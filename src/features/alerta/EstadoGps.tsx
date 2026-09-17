import Feather from '@expo/vector-icons/Feather'
import { Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import type { EstadoGps as Estado } from './ubicacion'

/**
 * Lo que el ciudadano necesita saber no es el estado del GPS, sino qué le va a pasar al pedir ayuda: o su ubicación
 * viaja sola, o tendrá que marcar el punto en el mapa (PB-02 R2).
 */
export function EstadoGps({ estado }: { estado: Estado }) {
  const tema = useTheme()

  // Con GPS todo sigue su curso: basta una línea discreta que confirme que la app ya sabe dónde está.
  if (estado === 'listo') {
    return (
      <XStack self="center" items="center" gap={6}>
        <Feather name="map-pin" size={13} color={tema.textoSecundario?.val} />
        <Text color="$textoSecundario" fontSize={13}>
          Ya sabemos dónde estás
        </Text>
      </XStack>
    )
  }

  // Sin GPS habrá un paso más: se avisa antes, y es lo único que compite con el botón.
  return (
    <XStack items="center" gap={12} p={14} rounded={16} bg="$enAtencionTinte">
      <YStack width={36} height={36} shrink={0} rounded={999} bg="$superficie" items="center" justify="center">
        <Feather name="map-pin" size={18} color={tema.enAtencionTexto?.val} />
      </YStack>
      <YStack flex={1} gap={2}>
        <Text color="$enAtencionTexto" fontSize={15} lineHeight={20} fontWeight="600">
          Te pediremos marcar dónde estás
        </Text>
        <Paragraph color="$enAtencionTexto" fontSize={13} lineHeight={18}>
          {estado === 'apagado'
            ? 'Tu GPS está apagado, así que señalarás el punto en el mapa. La ayuda sale igual.'
            : 'La app no puede ver tu ubicación, así que señalarás el punto en el mapa. La ayuda sale igual.'}
        </Paragraph>
      </YStack>
    </XStack>
  )
}
