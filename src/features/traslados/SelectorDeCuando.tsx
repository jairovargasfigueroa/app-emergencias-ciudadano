import { ScrollView } from 'react-native'
import { Button, Sheet, Text, XStack, YStack } from 'tamagui'

/** Horas en las que una empresa de ambulancias programa traslados, cada media hora. */
const HORAS = Array.from({ length: 29 }, (_, indice) => {
  const minutos = 6 * 60 + indice * 30
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
})

/** Los próximos siete días, contando hoy. Más allá no se programa un traslado. */
function proximosDias() {
  return Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + indice)
    fecha.setHours(0, 0, 0, 0)
    return fecha
  })
}

function etiquetaDeDia(fecha: Date, indice: number) {
  if (indice === 0) {
    return 'Hoy'
  }
  if (indice === 1) {
    return 'Mañana'
  }
  return fecha.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' })
}

type Props = {
  abierto: boolean
  /** Día elegido, o `null` si el traslado es para lo antes posible. */
  dia: Date | null
  hora: string
  onCambiar: (dia: Date | null, hora: string) => void
  onCerrar: () => void
}

/**
 * Se pregunta a qué hora tiene que estar en el destino, no a qué hora pasa la ambulancia: la familia sabe la
 * hora de la cita, y de ahí el sistema calcula cuándo tiene que salir la unidad.
 */
export function SelectorDeCuando({ abierto, dia, hora, onCambiar, onCerrar }: Props) {
  const dias = proximosDias()

  return (
    <Sheet modal open={abierto} onOpenChange={(valor: boolean) => !valor && onCerrar()} snapPointsMode="fit">
      <Sheet.Overlay bg="$velo" />
      <Sheet.Frame bg="$superficie" p={20} gap={14} borderTopLeftRadius={20} borderTopRightRadius={20}>
        <Text fontSize={17} fontWeight="600" color="$texto">
          ¿Cuándo?
        </Text>

        <YStack
          gap={2}
          px={14}
          py={12}
          rounded={12}
          borderWidth={1}
          borderColor={dia === null ? '$primario' : '$borde'}
          bg={dia === null ? '$primarioTinte' : 'transparent'}
          pressStyle={{ bg: '$fondo' }}
          onPress={() => onCambiar(null, hora)}
        >
          <Text fontSize={15} fontWeight="600" color="$texto">
            Lo antes posible
          </Text>
          <Text fontSize={13} lineHeight={18} color="$textoSecundario">
            Buscamos una unidad ahora mismo.
          </Text>
        </YStack>

        <Text fontSize={12} fontWeight="600" color="$textoTenue" letterSpacing={0.5}>
          O PROGRAMARLO
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap={8} pr={20}>
            {dias.map((fecha, indice) => {
              const elegido = dia !== null && dia.getTime() === fecha.getTime()
              return (
                <YStack
                  key={fecha.toISOString()}
                  px={14}
                  py={10}
                  rounded={999}
                  borderWidth={1}
                  borderColor={elegido ? '$primario' : '$borde'}
                  bg={elegido ? '$primarioTinte' : 'transparent'}
                  pressStyle={{ bg: '$fondo' }}
                  onPress={() => onCambiar(fecha, hora)}
                >
                  <Text fontSize={14} fontWeight={elegido ? '600' : '500'} color="$texto">
                    {etiquetaDeDia(fecha, indice)}
                  </Text>
                </YStack>
              )
            })}
          </XStack>
        </ScrollView>

        <Text fontSize={13} color="$textoSecundario">
          ¿A qué hora tiene que estar en el destino?
        </Text>

        <ScrollView style={{ maxHeight: 180 }}>
          <XStack gap={8} flexWrap="wrap">
            {HORAS.map((opcion) => {
              const elegida = opcion === hora && dia !== null
              return (
                <YStack
                  key={opcion}
                  px={12}
                  py={8}
                  rounded={10}
                  borderWidth={1}
                  borderColor={elegida ? '$primario' : '$borde'}
                  bg={elegida ? '$primarioTinte' : 'transparent'}
                  pressStyle={{ bg: '$fondo' }}
                  onPress={() => onCambiar(dia ?? dias[0], opcion)}
                >
                  <Text fontSize={14} fontWeight={elegida ? '600' : '500'} color="$texto" fontFamily="$mono">
                    {opcion}
                  </Text>
                </YStack>
              )
            })}
          </XStack>
        </ScrollView>

        <Button size="$4" chromeless onPress={onCerrar}>
          <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
            Listo
          </Button.Text>
        </Button>
      </Sheet.Frame>
    </Sheet>
  )
}
