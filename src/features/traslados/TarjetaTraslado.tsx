import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { Text, XStack, YStack, useTheme } from 'tamagui'

import { diaNatural, horaCorta } from '@/shared/formato/tiempo'
import { Insignia } from '@/shared/ui/Insignia'

import { yaEsHoraDeSalir, type Traslado } from './api'
import { RutaDelTraslado } from './RutaDelTraslado'
import { TEXTO_ESTADO, TONO_ESTADO, ventanaDeRecogida } from './textos'

/**
 * Un traslado en la lista. Lo que la familia busca es de dónde a dónde va y a qué hora pasan: eso manda sobre el
 * resto y va en líneas propias, no apretado en una sola que se corta.
 */
export function TarjetaTraslado({ traslado }: { traslado: Traslado }) {
  const tema = useTheme()
  // Cuando ya es hora de salir, la ventana contesta mejor el "cuándo" que la hora de la cita: es lo que la
  // familia mira para bajar a la puerta. La cita sigue estando en el detalle.
  const ventana = yaEsHoraDeSalir(traslado.estado) ? ventanaDeRecogida(traslado) : null

  return (
    <YStack
      gap={12}
      p={14}
      rounded={14}
      bg="$superficie"
      borderWidth={1}
      borderColor="$borde"
      pressStyle={{ bg: '$fondo' }}
      onPress={() => router.push({ pathname: '/traslado/[trasladoId]', params: { trasladoId: String(traslado.id) } })}
    >
      <YStack gap={4}>
        <XStack items="center" justify="space-between" gap={8}>
          <Text fontSize={17} lineHeight={22} fontWeight="600" color="$texto" flex={1} numberOfLines={1}>
            {traslado.pasajero}
          </Text>
          <Insignia tono={TONO_ESTADO[traslado.estado]}>{TEXTO_ESTADO[traslado.estado]}</Insignia>
        </XStack>
        <Text fontSize={13} color="$textoSecundario" numberOfLines={1}>
          {diaNatural(traslado.horaCita ?? traslado.fechaHoraCreacion)}
        </Text>
      </YStack>

      <RutaDelTraslado
        origen={traslado.origenReferencia ?? 'Origen marcado en el mapa'}
        destino={traslado.centroSaludDestino ?? 'Destino marcado en el mapa'}
      />

      <XStack items="center" justify="space-between" gap={8}>
        <Text
          fontSize={14}
          fontWeight={ventana ? '600' : '400'}
          color={ventana ? '$texto' : '$textoSecundario'}
          flex={1}
          numberOfLines={1}
        >
          {ventana ?? horaPedida(traslado)}
        </Text>
        <Feather name="chevron-right" size={20} color={tema.textoTenue?.val} />
      </XStack>
    </YStack>
  )
}

/** Todavía sin ventana: lo que contesta el "cuándo" es la hora a la que tiene que estar; sin cita, que es para ya. */
function horaPedida(traslado: Traslado) {
  return traslado.horaCita ? `Tiene que estar ${horaCorta(traslado.horaCita)}` : 'Lo antes posible'
}
