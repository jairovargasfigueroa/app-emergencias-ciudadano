import { ScrollView } from 'react-native'
import { Button, Sheet, Text, XStack, YStack } from 'tamagui'

import { MensajeDeCampo } from '@/shared/ui/MensajeDeCampo'

/** Horas en las que una empresa de ambulancias programa traslados, cada media hora. */
const HORAS = Array.from({ length: 29 }, (_, indice) => {
  const minutos = 6 * 60 + indice * 30
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
})

function minutosDelDia(hora: string) {
  const [horas, minutos] = hora.split(':').map(Number)
  return horas * 60 + minutos
}

/** Las horas que todavía se pueden elegir ese día: para hoy, solo las que no pasaron. */
function horasDelDia(dia: Date) {
  const ahora = new Date()
  const esHoy =
    dia.getFullYear() === ahora.getFullYear() && dia.getMonth() === ahora.getMonth() && dia.getDate() === ahora.getDate()
  if (!esHoy) {
    return HORAS
  }
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
  return HORAS.filter((hora) => minutosDelDia(hora) > minutosAhora)
}

/**
 * Los próximos siete días, contando hoy. Más allá no se programa un traslado. Hoy sale de la lista cuando ya no le
 * queda ninguna hora.
 */
function proximosDias() {
  return Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + indice)
    fecha.setHours(0, 0, 0, 0)
    return fecha
  }).filter((fecha) => horasDelDia(fecha).length > 0)
}

/** Por la fecha y no por la posición en la lista: hoy puede no estar, y entonces la primera es mañana. */
function etiquetaDeDia(fecha: Date) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diferencia = Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000)
  if (diferencia === 0) {
    return 'Hoy'
  }
  if (diferencia === 1) {
    return 'Mañana'
  }
  return fecha.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' })
}

type Props = {
  abierto: boolean
  /**
   * Día elegido, o `null` si el traslado es para lo antes posible. `undefined` mientras no se eligió nada, como al
   * pedir otra vez: entonces no aparece nada marcado.
   */
  dia: Date | null | undefined
  hora: string
  /** Por qué hay que volver a elegir, cuando el servidor rechazó la hora. Queda a la vista hasta que se cambie. */
  aviso: string | null
  onCambiar: (dia: Date | null, hora: string) => void
  onCerrar: () => void
}

/**
 * Se pregunta a qué hora tiene que estar en el destino, no a qué hora pasa la ambulancia: la familia sabe la
 * hora de la cita, y de ahí el sistema calcula cuándo tiene que salir la unidad.
 */
export function SelectorDeCuando({ abierto, dia, hora, aviso, onCambiar, onCerrar }: Props) {
  const dias = proximosDias()
  // Tocar una hora sin haber tocado un día la deja para el primero que se puede: hoy, o mañana si hoy ya no da.
  const diaPorDefecto = dias[0]
  const horas = horasDelDia(dia ?? diaPorDefecto)

  /** Al cambiar de día se conserva la hora si ese día la tiene; si no, va la primera que queda. */
  function elegirDia(fecha: Date) {
    const disponibles = horasDelDia(fecha)
    onCambiar(fecha, disponibles.includes(hora) ? hora : disponibles[0])
  }

  return (
    <Sheet modal open={abierto} onOpenChange={(valor: boolean) => !valor && onCerrar()} snapPointsMode="fit">
      <Sheet.Overlay bg="$velo" />
      <Sheet.Frame bg="$superficie" p={20} gap={14} borderTopLeftRadius={20} borderTopRightRadius={20}>
        <YStack gap={4}>
          <Text fontSize={17} fontWeight="600" color="$texto">
            ¿Cuándo?
          </Text>
          <MensajeDeCampo texto={aviso} />
        </YStack>

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
            {dias.map((fecha) => {
              const elegido = dia != null && dia.getTime() === fecha.getTime()
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
                  onPress={() => elegirDia(fecha)}
                >
                  <Text fontSize={14} fontWeight={elegido ? '600' : '500'} color="$texto">
                    {etiquetaDeDia(fecha)}
                  </Text>
                </YStack>
              )
            })}
          </XStack>
        </ScrollView>

        <Text fontSize={13} color="$textoSecundario">
          ¿A qué hora tiene que estar en el destino?
        </Text>

        {horas.length === 0 ? (
          <Text fontSize={13} lineHeight={18} color="$textoSecundario">
            Para hoy ya no quedan horas. Elige otro día.
          </Text>
        ) : (
          <ScrollView style={{ maxHeight: 180 }}>
            <XStack gap={8} flexWrap="wrap">
              {horas.map((opcion) => {
                const elegida = opcion === hora && dia != null
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
                    onPress={() => onCambiar(dia ?? diaPorDefecto, opcion)}
                  >
                    <Text fontSize={14} fontWeight={elegida ? '600' : '500'} color="$texto" fontFamily="$mono">
                      {opcion}
                    </Text>
                  </YStack>
                )
              })}
            </XStack>
          </ScrollView>
        )}

        <Button size="$4" chromeless onPress={onCerrar}>
          <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
            Listo
          </Button.Text>
        </Button>
      </Sheet.Frame>
    </Sheet>
  )
}
