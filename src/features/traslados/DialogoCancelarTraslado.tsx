import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, Spinner, YStack } from 'tamagui'

type Props = {
  abierto: boolean
  enviando: boolean
  /** Hay una unidad en camino: cancelar le avisa y la deja libre. */
  conUnidadEnCamino: boolean
  onConfirmar: () => void
  onCerrar: () => void
}

/**
 * Cancelar se confirma antes, diciendo qué pasa. Con la unidad en camino no es solo borrar un pedido: hay una
 * tripulación que se entera en ese momento y se vuelve.
 */
export function DialogoCancelarTraslado({ abierto, enviando, conUnidadEnCamino, onConfirmar, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()

  return (
    <Sheet
      modal
      open={abierto}
      onOpenChange={(siguiente: boolean) => {
        if (!siguiente && !enviando) {
          onCerrar()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      dismissOnOverlayPress={!enviando}
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
            ¿Cancelar el traslado?
          </H2>
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            {conUnidadEnCamino
              ? 'La unidad que va en camino recibe el aviso y queda libre para otro servicio.'
              : 'Se retira el pedido y no sale ninguna unidad. Si después lo necesitas, lo pides otra vez.'}
          </Paragraph>
        </YStack>

        <YStack gap={10}>
          <Button
            height={52}
            rounded={14}
            bg="$primario"
            borderWidth={0}
            disabled={enviando}
            opacity={enviando ? 0.6 : 1}
            icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
            pressStyle={{ bg: '$primarioPresionado' }}
            onPress={onConfirmar}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Cancelar el traslado
            </Button.Text>
          </Button>
          <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" disabled={enviando} onPress={onCerrar}>
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Lo sigo necesitando
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
