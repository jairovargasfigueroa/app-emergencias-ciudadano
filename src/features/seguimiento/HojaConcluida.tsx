import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { Button, H1, Paragraph, XStack, YStack, useTheme } from 'tamagui'

import type { EstadoIncidente } from './api'

const MENSAJES: Partial<Record<EstadoIncidente, { titulo: string; detalle: string }>> = {
  ATENDIDO: { titulo: 'Servicio concluido', detalle: 'El paciente fue entregado.' },
  // Cerrar por falsa alarma no es un reproche a quien pidió ayuda: avisar estuvo bien.
  FALSA_ALARMA: { titulo: 'Caso cerrado', detalle: 'La central confirmó que no hacía falta una ambulancia.' },
  ATENDIDO_EXTERNAMENTE: { titulo: 'Caso cerrado', detalle: 'Otro servicio atendió la emergencia.' },
  CANCELADO: { titulo: 'Caso cancelado', detalle: 'La central canceló este caso.' },
}

/** PB-06 R4 y CA-07: el incidente llegó a un estado final y el seguimiento terminó. */
export function HojaConcluida({ estado }: { estado: EstadoIncidente }) {
  const tema = useTheme()
  const mensaje = MENSAJES[estado] ?? { titulo: 'Caso cerrado', detalle: 'El caso ya no está abierto.' }
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
          {mensaje.titulo}
        </H1>
      </XStack>

      <Paragraph color="$texto" fontSize={16} lineHeight={24}>
        {mensaje.detalle}
      </Paragraph>
      <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
        {estado === 'FALSA_ALARMA'
          ? 'Hiciste bien en avisar. Dejamos de seguir la ubicación de las unidades.'
          : 'Dejamos de seguir la ubicación de las unidades.'}
      </Paragraph>

      {/*
       * Vuelve al inicio que ya está debajo si el seguimiento se abrió desde el botón o desde el pin; si se restauró al
       * abrir la app no hay inicio debajo, y dismissTo lo pone en lugar del seguimiento en vez de apilar otro.
       */}
      <Button
        height={52}
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
  )
}
