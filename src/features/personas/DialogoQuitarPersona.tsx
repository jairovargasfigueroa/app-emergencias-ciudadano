import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, Spinner, YStack } from 'tamagui'

import type { Persona } from './api'

type Props = {
  abierto: boolean
  /** A quién se quita. Queda puesta al cerrar, para que el nombre no desaparezca mientras baja la hoja. */
  persona: Persona | null
  enviando: boolean
  onConfirmar: () => void
  onCerrar: () => void
}

/**
 * Quitar a alguien se confirma antes. Deja de aparecer al pedir un traslado, pero lo que ya se pidió para esa
 * persona sigue igual: se dice, para que nadie piense que se le cancela el viaje.
 */
export function DialogoQuitarPersona({ abierto, persona, enviando, onConfirmar, onCerrar }: Props) {
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
            ¿Quitar a {persona?.nombreCompleto}?
          </H2>
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            Deja de aparecer al pedir un traslado. Los traslados que ya pediste para esta persona siguen igual.
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
              Quitar
            </Button.Text>
          </Button>
          <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" disabled={enviando} onPress={onCerrar}>
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Volver
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
