import Feather from '@expo/vector-icons/Feather'
import { Button, Text, TextArea, XStack, YStack, useTheme } from 'tamagui'

import {
  LARGO_MAXIMO_DESCRIPCION,
  MAXIMO_AFECTADOS,
  actualizarDetallesAlerta,
  useDetallesAlerta,
} from './detalles'

/** PB-02 R3: cantidad de afectados y descripción. Son opcionales y la alerta sale igual sin ellos. */
export function DetallesOpcionales() {
  const tema = useTheme()
  const { cantidadAfectados, descripcion } = useDetallesAlerta()
  const sinCantidad = cantidadAfectados === null

  return (
    <YStack gap={14} p={18} rounded={16} borderWidth={1} borderColor="$borde" bg="$superficie">
      <XStack items="baseline" justify="space-between" gap={12}>
        <Text color="$texto" fontSize={15} fontWeight="600">
          Detalles opcionales
        </Text>
        <Text color="$textoSecundario" fontSize={13}>
          No frenan la alerta
        </Text>
      </XStack>

      <XStack items="center" justify="space-between" gap={12}>
        <Text color="$texto" fontSize={15}>
          Personas afectadas
        </Text>
        <XStack items="center" gap={4}>
          <Button
            width={44}
            height={44}
            p={0}
            rounded={12}
            bg="$superficie"
            borderColor="$borde"
            disabled={sinCantidad}
            opacity={sinCantidad ? 0.4 : 1}
            aria-label="Una persona menos"
            onPress={() =>
              actualizarDetallesAlerta({
                cantidadAfectados: cantidadAfectados === null || cantidadAfectados <= 1 ? null : cantidadAfectados - 1,
              })
            }
          >
            <Feather name="minus" size={18} color={tema.texto?.val} />
          </Button>
          <Text
            width={40}
            text="center"
            fontSize={18}
            fontWeight="600"
            color={sinCantidad ? '$textoTenue' : '$texto'}
            aria-live="polite"
          >
            {cantidadAfectados ?? '—'}
          </Text>
          <Button
            width={44}
            height={44}
            p={0}
            rounded={12}
            bg="$superficie"
            borderColor="$borde"
            aria-label="Una persona más"
            onPress={() =>
              actualizarDetallesAlerta({ cantidadAfectados: Math.min((cantidadAfectados ?? 0) + 1, MAXIMO_AFECTADOS) })
            }
          >
            <Feather name="plus" size={18} color={tema.texto?.val} />
          </Button>
        </XStack>
      </XStack>

      <TextArea
        value={descripcion}
        onChangeText={(texto) => actualizarDetallesAlerta({ descripcion: texto })}
        placeholder="¿Qué pasó? Ej.: choque en la avenida"
        placeholderTextColor="$textoTenue"
        maxLength={LARGO_MAXIMO_DESCRIPCION}
        minH={52}
        rounded={12}
        fontSize={15}
        bg="$superficie"
        borderColor="$borde"
        aria-label="Qué pasó"
      />
    </YStack>
  )
}
