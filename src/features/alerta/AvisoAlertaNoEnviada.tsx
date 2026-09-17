import Feather from '@expo/vector-icons/Feather'
import { Button, Spinner, Text, XStack, useTheme } from 'tamagui'

type Props = {
  /** El reintento va en camino: el botón no se puede tocar otra vez. */
  reintentando: boolean
  onReintentar: () => void
}

/**
 * El servidor rechazó la alerta. En vez de un aviso que se va solo, queda fijo junto al botón hasta que el reintento
 * salga bien o empiece un intento nuevo, y reintentar es un solo toque. Tamagui no trae un aviso en línea.
 */
export function AvisoAlertaNoEnviada({ reintentando, onReintentar }: Props) {
  const tema = useTheme()

  return (
    <XStack self="stretch" items="center" gap={10} py={10} pl={14} pr={10} rounded={14} bg="$primarioTinte" role="alert">
      <Feather name="alert-circle" size={20} color={tema.primario?.val} />
      <Text flex={1} color="$texto" fontSize={15} lineHeight={20} fontWeight="600">
        No pudimos enviar tu alerta
      </Text>
      <Button
        height={40}
        px={14}
        rounded={10}
        borderWidth={0}
        bg="$primario"
        pressStyle={{ bg: '$primarioPresionado' }}
        disabled={reintentando}
        opacity={reintentando ? 0.7 : 1}
        icon={reintentando ? <Spinner color="$primarioTexto" /> : undefined}
        aria-busy={reintentando}
        onPress={onReintentar}
      >
        <Button.Text color="$primarioTexto" fontSize={15} fontWeight="600">
          Reintentar
        </Button.Text>
      </Button>
    </XStack>
  )
}
