import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, YStack } from 'tamagui'

type Props = {
  abierto: boolean
  onActivar: () => void
  onCerrar: () => void
}

/**
 * Antes del cuadro del sistema se dice para qué son los avisos, y el cuadro sale solo si la persona acepta. Se
 * pregunta una sola vez: con "Ahora no" o cerrando la hoja, la app no vuelve a preguntar sola.
 */
export function DialogoActivarAvisos({ abierto, onActivar, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()

  return (
    <Sheet
      modal
      open={abierto}
      onOpenChange={(siguiente: boolean) => {
        if (!siguiente) {
          onCerrar()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
    >
      <Sheet.Overlay bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        gap={18}
        px={20}
        pt={24}
        pb={margenes.bottom + 24}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
      >
        <YStack gap={6}>
          <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            ¿Te avisamos cómo va tu pedido?
          </H2>
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            Te pediremos permiso para avisarte cuando la ambulancia va en camino, aunque tengas la app cerrada.
          </Paragraph>
        </YStack>

        <YStack gap={10}>
          <Button
            height={52}
            rounded={14}
            bg="$primario"
            borderWidth={0}
            pressStyle={{ bg: '$primarioPresionado' }}
            onPress={onActivar}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Activar avisos
            </Button.Text>
          </Button>
          <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" onPress={onCerrar}>
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Ahora no
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
