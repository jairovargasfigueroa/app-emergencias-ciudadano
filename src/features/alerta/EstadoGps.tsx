import Feather from '@expo/vector-icons/Feather'
import { Platform } from 'react-native'
import { Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import type { EstadoGps as Estado } from './ubicacion'

/** Qué pasa al pedir ayuda sin GPS: primero se pide lo que falte, y si no se puede, se marca el punto (PB-02 R2). */
const AVISOS: Record<Exclude<Estado, 'listo'>, { titulo: string; detalle: string }> = {
  apagado: {
    titulo: 'Tu ubicación está apagada',
    detalle:
      // En Android la app puede pedir encenderla con un cuadro del sistema; en iOS solo se enciende desde los ajustes.
      Platform.OS === 'android'
        ? 'Al pedir ayuda te pediremos encenderla. Si no puedes, marcarás el punto en el mapa. La ayuda sale igual.'
        : 'Enciéndela en los ajustes del teléfono. Si no, al pedir ayuda marcarás el punto en el mapa. La ayuda sale igual.',
  },
  sinPermiso: {
    titulo: 'La app no puede ver tu ubicación',
    detalle:
      'Al pedir ayuda te pediremos permiso para usarla. Si no lo das, marcarás el punto en el mapa. La ayuda sale igual.',
  },
  permisoBloqueado: {
    titulo: 'La app no puede ver tu ubicación',
    detalle:
      'Actívala para esta app en los ajustes del teléfono. Si no, al pedir ayuda marcarás el punto en el mapa. La ayuda sale igual.',
  },
}

/**
 * Lo que el ciudadano necesita saber no es el estado del GPS, sino qué le va a pasar al pedir ayuda: o su ubicación
 * viaja sola, o se le pide lo que falte, y si no se puede, marca el punto en el mapa (PB-02 R2).
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

  const aviso = AVISOS[estado]

  // Sin GPS habrá un paso más: se avisa antes, y es lo único que compite con el botón.
  return (
    <XStack items="center" gap={12} p={14} rounded={16} bg="$enAtencionTinte">
      <YStack width={36} height={36} shrink={0} rounded={999} bg="$superficie" items="center" justify="center">
        <Feather name="map-pin" size={18} color={tema.enAtencionTexto?.val} />
      </YStack>
      <YStack flex={1} gap={2}>
        <Text color="$enAtencionTexto" fontSize={15} lineHeight={20} fontWeight="600">
          {aviso.titulo}
        </Text>
        <Paragraph color="$enAtencionTexto" fontSize={13} lineHeight={18}>
          {aviso.detalle}
        </Paragraph>
      </YStack>
    </XStack>
  )
}
