import Feather from '@expo/vector-icons/Feather'
import { YStack } from 'tamagui'

/** Cuadro rojo con la cruz del sistema. */
export function MarcaSga({ tamano = 32 }: { tamano?: number }) {
  return (
    <YStack width={tamano} height={tamano} rounded={tamano * 0.28} bg="$primario" items="center" justify="center">
      <Feather name="plus" size={tamano * 0.5} color="#FFFFFF" />
    </YStack>
  )
}
