import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, YStack } from 'tamagui'

import type { EstadoIncidente } from './api'

const MENSAJES: Partial<Record<EstadoIncidente, { titulo: string; detalle: string }>> = {
  ATENDIDO: { titulo: 'Servicio concluido', detalle: 'El paciente fue entregado.' },
  FALSA_ALARMA: { titulo: 'Incidente cerrado', detalle: 'La central cerró la alerta como falsa alarma.' },
  ATENDIDO_EXTERNAMENTE: { titulo: 'Incidente cerrado', detalle: 'Otro servicio atendió la emergencia.' },
  CANCELADO: { titulo: 'Incidente cancelado', detalle: 'El incidente se canceló.' },
}

/** PB-06 R4 y CA-07: el incidente llegó a un estado final y el seguimiento terminó. */
export function SeguimientoConcluido({ estado }: { estado: EstadoIncidente }) {
  const margenes = useSafeAreaInsets()
  const mensaje = MENSAJES[estado] ?? { titulo: 'Incidente cerrado', detalle: 'El incidente ya no está abierto.' }
  const atendido = estado === 'ATENDIDO'

  return (
    <YStack flex={1} bg="$fondo" justify="center" px={24} pt={margenes.top} pb={margenes.bottom}>
      <YStack items="center" gap={12} px={20} py={28} rounded={16} borderWidth={1} borderColor="$borde" bg="$superficie">
        <YStack
          width={64}
          height={64}
          rounded={999}
          bg={atendido ? '$disponible' : '$fueraServicio'}
          items="center"
          justify="center"
        >
          <Feather name={atendido ? 'check' : 'x'} size={32} color="#FFFFFF" />
        </YStack>
        <H1 color="$texto" fontSize={22} lineHeight={28} fontWeight="600" text="center">
          {mensaje.titulo}
        </H1>
        <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22} text="center" maxW={280}>
          {`${mensaje.detalle} Ya no seguimos la ubicación de las unidades.`}
        </Paragraph>
        <Button
          self="stretch"
          height={52}
          mt={6}
          rounded={14}
          bg="$superficie"
          borderColor="$bordeFuerte"
          onPress={() => router.dismissTo('/')}
        >
          <Button.Text color="$texto" fontSize={16} fontWeight="500">
            Volver al inicio
          </Button.Text>
        </Button>
      </YStack>
    </YStack>
  )
}
