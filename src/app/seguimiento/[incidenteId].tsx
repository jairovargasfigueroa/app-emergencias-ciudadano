import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H1, Paragraph, YStack } from 'tamagui'

/** Destino después de emitir la alerta. El seguimiento del incidente llega con PB-06. */
export default function Seguimiento() {
  const margenes = useSafeAreaInsets()
  return (
    <YStack flex={1} bg="$fondo" items="center" justify="center" gap={8} px={24} pt={margenes.top} pb={margenes.bottom}>
      <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600" text="center">
        Alerta enviada
      </H1>
      <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24} text="center">
        Recibimos tu pedido de ayuda.
      </Paragraph>
    </YStack>
  )
}
