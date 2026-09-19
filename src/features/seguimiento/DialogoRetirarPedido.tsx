import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Label, Paragraph, RadioGroup, Sheet, Spinner, Text, XStack, YStack } from 'tamagui'

import type { MotivoRetiro } from '@/features/alerta/api'

const MOTIVOS: { valor: MotivoRetiro; titulo: string; detalle: string }[] = [
  { valor: 'YA_FUE_ATENDIDO', titulo: 'Ya lo están atendiendo', detalle: 'Llegó ayuda por otro lado' },
  { valor: 'OTRO', titulo: 'Ya no hace falta', detalle: 'Se resolvió sin ambulancia' },
  { valor: 'ERROR', titulo: 'Fue un error', detalle: 'No quise pedir ayuda' },
]

type Props = {
  abierto: boolean
  enviando: boolean
  /** Hay una unidad en camino: se le avisa, pero seguir o volverse lo decide ella. */
  conUnidadEnCamino: boolean
  onConfirmar: (motivo: MotivoRetiro, emisorEsPaciente: boolean) => void
  onCerrar: () => void
}

/**
 * Retirar el pedido. Se pregunta quién necesitaba la ambulancia porque no pesa igual: el propio paciente puede decir
 * que ya está bien, pero quien avisó por otra persona no habla por el estado de esa persona.
 */
export function DialogoRetirarPedido({ abierto, enviando, conUnidadEnCamino, onConfirmar, onCerrar }: Props) {
  const margenes = useSafeAreaInsets()
  const [motivo, setMotivo] = useState<MotivoRetiro | null>(null)
  const [paraMi, setParaMi] = useState<boolean | null>(null)

  useEffect(() => {
    if (abierto) {
      setMotivo(null)
      setParaMi(null)
    }
  }, [abierto])

  const listo = motivo !== null && paraMi !== null

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
            Ya no necesito la ambulancia
          </H2>
          <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
            {conUnidadEnCamino
              ? 'Hay una unidad en camino. Le avisamos, y ella decide si sigue o se vuelve.'
              : 'Se retira tu pedido y podés volver a pedir ayuda cuando quieras.'}
          </Paragraph>
        </YStack>

        <YStack gap={8}>
          <Text color="$texto" fontSize={15} fontWeight="600">
            ¿Quién necesitaba la ambulancia?
          </Text>
          <XStack gap={8}>
            <Opcion texto="Yo" elegida={paraMi === true} onPress={() => setParaMi(true)} />
            <Opcion texto="Otra persona" elegida={paraMi === false} onPress={() => setParaMi(false)} />
          </XStack>
        </YStack>

        <RadioGroup
          value={motivo ?? ''}
          onValueChange={(valor) => setMotivo(valor as MotivoRetiro)}
          gap={8}
          aria-label="Por qué ya no hace falta"
        >
          {MOTIVOS.map(({ valor, titulo, detalle }) => {
            const elegido = motivo === valor
            const id = `retiro-${valor}`
            return (
              <XStack
                key={valor}
                items="center"
                gap={12}
                minH={52}
                px={14}
                py={12}
                rounded={14}
                borderWidth={elegido ? 2 : 1}
                borderColor={elegido ? '$primario' : '$borde'}
                onPress={() => setMotivo(valor)}
              >
                <RadioGroup.Item value={valor} id={id} size="$4" borderColor={elegido ? '$primario' : '$bordeFuerte'}>
                  <RadioGroup.Indicator bg="$primario" />
                </RadioGroup.Item>
                <YStack flex={1} gap={2}>
                  <Label htmlFor={id} color="$texto" fontSize={15} lineHeight={20} fontWeight={elegido ? '600' : '500'}>
                    {titulo}
                  </Label>
                  <Text color="$textoSecundario" fontSize={13}>
                    {detalle}
                  </Text>
                </YStack>
              </XStack>
            )
          })}
        </RadioGroup>

        <YStack gap={10}>
          <Button
            height={52}
            rounded={14}
            bg="$primario"
            borderWidth={0}
            disabled={!listo || enviando}
            opacity={!listo || enviando ? 0.6 : 1}
            icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
            pressStyle={{ bg: '$primarioPresionado' }}
            onPress={() => listo && onConfirmar(motivo, paraMi)}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Retirar mi pedido
            </Button.Text>
          </Button>
          <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" disabled={enviando} onPress={onCerrar}>
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Sigo necesitándola
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}

function Opcion({ texto, elegida, onPress }: { texto: string; elegida: boolean; onPress: () => void }) {
  return (
    <Button
      flex={1}
      height={52}
      rounded={14}
      bg={elegida ? '$primarioTinte' : '$superficie'}
      borderWidth={elegida ? 2 : 1}
      borderColor={elegida ? '$primario' : '$borde'}
      onPress={onPress}
    >
      <Button.Text color={elegida ? '$primarioPresionado' : '$texto'} fontSize={15} fontWeight={elegida ? '600' : '500'}>
        {texto}
      </Button.Text>
    </Button>
  )
}
