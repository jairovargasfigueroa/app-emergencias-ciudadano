import Feather from '@expo/vector-icons/Feather'
import { Button, Spinner, Text, YStack } from 'tamagui'

type Props = {
  ocupado: boolean
  onPress: () => void
}

/** Botón de alerta con dos anillos alrededor. Tamagui no trae uno así: se arma con sus piezas base. */
export function BotonPedirAyuda({ ocupado, onPress }: Props) {
  return (
    <YStack width={280} height={280} items="center" justify="center">
      <YStack position="absolute" width={280} height={280} rounded={999} bg="$primarioTinte" />
      <YStack position="absolute" width={240} height={240} rounded={999} bg="$primario" opacity={0.14} />
      <Button
        width={204}
        height={204}
        rounded={999}
        p={0}
        borderWidth={0}
        bg="$primario"
        pressStyle={{ bg: '$primarioPresionado', scale: 0.97 }}
        shadowColor="$primario"
        shadowOpacity={0.35}
        shadowRadius={18}
        shadowOffset={{ width: 0, height: 12 }}
        elevation={8}
        disabled={ocupado}
        aria-label="Pedir ayuda"
        aria-busy={ocupado}
        onPress={onPress}
      >
        <YStack items="center" gap={10}>
          {ocupado ? <Spinner size="large" color="$primarioTexto" /> : <Feather name="plus" size={40} color="#FFFFFF" />}
          <Text color="$primarioTexto" fontSize={22} lineHeight={26} fontWeight="600">
            Pedir ayuda
          </Text>
        </YStack>
      </Button>
    </YStack>
  )
}
