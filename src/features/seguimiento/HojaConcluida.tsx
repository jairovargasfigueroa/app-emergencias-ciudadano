import Feather from '@expo/vector-icons/Feather'
import { Button, H1, Paragraph, XStack, YStack, useTheme } from 'tamagui'

import type { EstadoIncidente } from './api'
import { volverAlInicio } from './navegacion'

/**
 * Todos los estados finales se dan como "Servicio concluido", con una línea neutra que dice cómo terminó. CANCELADO y
 * cualquier otro estado final llevan la línea genérica, sin atribuirle el cierre a nadie.
 */
const DETALLES: Partial<Record<EstadoIncidente, string>> = {
  ATENDIDO: 'La unidad atendió la emergencia.',
  FALSA_ALARMA: 'La unidad fue al lugar y no encontró a nadie.',
  ATENDIDO_EXTERNAMENTE: 'Ya lo habían llevado por otro medio.',
}

/** PB-06 R4 y CA-07: el incidente llegó a un estado final y el seguimiento terminó. */
export function HojaConcluida({ estado }: { estado: EstadoIncidente }) {
  const tema = useTheme()
  const detalle = DETALLES[estado] ?? 'El caso se cerró.'
  const atendido = estado === 'ATENDIDO'

  return (
    <YStack gap={16}>
      <XStack items="center" gap={12}>
        <YStack
          width={52}
          height={52}
          shrink={0}
          rounded={999}
          bg={atendido ? '$disponibleTinte' : '$fueraServicioTinte'}
          items="center"
          justify="center"
        >
          <Feather
            name={atendido ? 'check' : 'flag'}
            size={26}
            color={atendido ? tema.disponibleTexto?.val : tema.fueraServicioTexto?.val}
          />
        </YStack>
        <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600" flex={1}>
          Servicio concluido
        </H1>
      </XStack>

      <Paragraph color="$texto" fontSize={16} lineHeight={24}>
        {detalle}
      </Paragraph>
      {/* Cerrar por falsa alarma no es un reproche a quien pidió ayuda: avisar estuvo bien. */}
      <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
        {estado === 'FALSA_ALARMA'
          ? 'Hiciste bien en avisar. Dejamos de seguir la ubicación de las unidades.'
          : 'Dejamos de seguir la ubicación de las unidades.'}
      </Paragraph>

      <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" onPress={volverAlInicio}>
        <Button.Text color="$texto" fontSize={16} fontWeight="500">
          Volver al inicio
        </Button.Text>
      </Button>
    </YStack>
  )
}
