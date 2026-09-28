import Feather from '@expo/vector-icons/Feather'
import { Button, H1, Paragraph, XStack, YStack, useTheme } from 'tamagui'

import { volverAlInicio } from './navegacion'

/**
 * El ciudadano retiró su pedido: el caso terminó para este teléfono, aunque el incidente siga abierto por otros. Ya no
 * se sigue a ninguna unidad y el inicio vuelve a ofrecer el botón de ayuda.
 */
export function HojaPedidoRetirado() {
  const tema = useTheme()

  return (
    <YStack gap={16}>
      <XStack items="center" gap={12}>
        <YStack
          width={52}
          height={52}
          shrink={0}
          rounded={999}
          bg="$fueraServicioTinte"
          items="center"
          justify="center"
        >
          <Feather name="flag" size={26} color={tema.fueraServicioTexto?.val} />
        </YStack>
        <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600" flex={1}>
          Retiraste tu pedido
        </H1>
      </XStack>

      <Paragraph color="$texto" fontSize={16} lineHeight={24}>
        Si vuelves a necesitar ayuda, pídela desde el inicio.
      </Paragraph>

      <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" onPress={volverAlInicio}>
        <Button.Text color="$texto" fontSize={16} fontWeight="500">
          Volver al inicio
        </Button.Text>
      </Button>
    </YStack>
  )
}
