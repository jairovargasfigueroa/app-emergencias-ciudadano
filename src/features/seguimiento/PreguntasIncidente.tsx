import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Button, Text, TextArea, XStack, YStack, useTheme } from 'tamagui'

import type { DetallesAlerta } from '@/features/alerta/api'
import { completarDetallesMutation } from '@/features/alerta/queries'
import { ciudadanoQuery } from '@/features/registro/queries'
import { ErrorApi } from '@/shared/api/cliente'

/** Espera desde la última tecla antes de guardar: el teléfono se puede soltar en cualquier segundo. */
const ESPERA_AL_ESCRIBIR_MS = 1200

const LARGO_MAXIMO_DESCRIPCION = 2000

/** Cuatro respuestas de un toque, sin `+` ni `−`. No hay "no sé": no contestar ya significa eso. */
const OPCIONES_AFECTADOS = [
  { valor: 1, texto: '1', etiqueta: '1 persona' },
  { valor: 2, texto: '2', etiqueta: '2 personas' },
  { valor: 3, texto: '3', etiqueta: '3 personas' },
  { valor: 4, texto: '4 o más', etiqueta: '4 personas o más' },
]

type Props = {
  alertaId: number
  /** Ya hay unidades acudiendo: las preguntas ceden el espacio y arrancan colapsadas. */
  compactas: boolean
}

/**
 * PB-02 R3: cantidad de afectados y descripción, opcionales. Se preguntan durante la espera, no antes de emitir, y
 * cada respuesta se guarda sola contra `POST /alertas/{alertaId}/detalles`.
 */
export function PreguntasIncidente({ alertaId, compactas }: Props) {
  const ciudadano = useQuery(ciudadanoQuery()).data
  const completar = useMutation(completarDetallesMutation())

  const [afectados, setAfectados] = useState<number | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [abiertaAfectados, setAbiertaAfectados] = useState(!compactas)
  const [abiertaQuePaso, setAbiertaQuePaso] = useState(!compactas)
  const ultimoTextoGuardado = useRef('')
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(temporizador.current), [])

  useEffect(() => {
    if (compactas) {
      setAbiertaAfectados(false)
      setAbiertaQuePaso(false)
    }
  }, [compactas])

  function guardar(cambios: DetallesAlerta) {
    if (!ciudadano) {
      return
    }
    // Se envía todo lo contestado hasta ahora, así una respuesta nueva nunca borra la anterior.
    const detalles: DetallesAlerta = {
      cantidadAfectados: afectados ?? undefined,
      descripcion: descripcion.trim() || undefined,
      ...cambios,
    }
    completar.mutate({ ciudadanoId: ciudadano.id, alertaId, detalles })
  }

  function elegirAfectados(valor: number) {
    setAfectados(valor)
    setAbiertaAfectados(false)
    guardar({ cantidadAfectados: valor })
  }

  function escribir(texto: string) {
    setDescripcion(texto)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => guardarTexto(texto), ESPERA_AL_ESCRIBIR_MS)
  }

  function guardarTexto(texto: string) {
    const limpio = texto.trim()
    if (limpio === ultimoTextoGuardado.current) {
      return
    }
    ultimoTextoGuardado.current = limpio
    guardar({ descripcion: limpio || undefined })
  }

  function terminarDeEscribir() {
    clearTimeout(temporizador.current)
    guardarTexto(descripcion)
    if (descripcion.trim()) {
      setAbiertaQuePaso(false)
    }
  }

  // PB-02 R3: los detalles nunca bloquean nada. Si ya no se aceptan, las preguntas desaparecen sin decir nada.
  const yaNoSeAceptan = completar.error instanceof ErrorApi && completar.error.status === 409
  if (!ciudadano || yaNoSeAceptan) {
    return null
  }

  return (
    <YStack gap={10}>
      <Text color="$textoTenue" fontSize={12} fontWeight="500">
        Opcional · ayuda a quien te atiende
      </Text>

      {abiertaAfectados ? (
        <YStack gap={12} p={16} rounded={16} borderWidth={1} borderColor="$borde" bg="$superficie">
          <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
            ¿Cuántas personas necesitan ayuda?
          </Text>
          <XStack gap={8}>
            {OPCIONES_AFECTADOS.map((opcion) => (
              <Button
                key={opcion.valor}
                flex={1}
                height={60}
                p={0}
                rounded={14}
                bg={afectados === opcion.valor ? '$primario' : '$fondo'}
                borderColor={afectados === opcion.valor ? '$primario' : '$borde'}
                aria-label={opcion.etiqueta}
                onPress={() => elegirAfectados(opcion.valor)}
              >
                <Button.Text
                  color={afectados === opcion.valor ? '$primarioTexto' : '$texto'}
                  fontSize={15}
                  lineHeight={19}
                  fontWeight="600"
                  text="center"
                >
                  {opcion.texto}
                </Button.Text>
              </Button>
            ))}
          </XStack>
        </YStack>
      ) : (
        <FilaPregunta
          pregunta="¿Cuántas personas necesitan ayuda?"
          respuesta={afectados === null ? null : (OPCIONES_AFECTADOS.find((o) => o.valor === afectados)?.texto ?? null)}
          onPress={() => setAbiertaAfectados(true)}
        />
      )}

      {abiertaQuePaso ? (
        <YStack gap={10} p={16} rounded={16} borderWidth={1} borderColor="$borde" bg="$superficie">
          <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
            ¿Qué pasó?
          </Text>
          <TextArea
            value={descripcion}
            onChangeText={escribir}
            onBlur={terminarDeEscribir}
            placeholder="Cuéntalo con tus palabras"
            placeholderTextColor="$textoTenue"
            maxLength={LARGO_MAXIMO_DESCRIPCION}
            minH={72}
            rounded={12}
            fontSize={15}
            bg="$fondo"
            borderColor="$borde"
            aria-label="Qué pasó"
          />
        </YStack>
      ) : (
        <FilaPregunta
          pregunta="¿Qué pasó?"
          respuesta={descripcion.trim() || null}
          onPress={() => setAbiertaQuePaso(true)}
        />
      )}
    </YStack>
  )
}

type PropsFila = {
  pregunta: string
  /** `null` si todavía no contestó: entonces la fila muestra la pregunta. */
  respuesta: string | null
  onPress: () => void
}

/** Pregunta colapsada. Contestada o no, se vuelve a abrir con un toque para corregirla. */
function FilaPregunta({ pregunta, respuesta, onPress }: PropsFila) {
  const tema = useTheme()

  return (
    <XStack
      items="center"
      gap={12}
      px={16}
      py={13}
      rounded={14}
      borderWidth={1}
      borderColor="$borde"
      bg="$superficie"
      pressStyle={{ bg: '$fondo' }}
      role="button"
      aria-label={respuesta ? `${pregunta} ${respuesta}. Tocar para corregir` : pregunta}
      onPress={onPress}
    >
      <YStack flex={1} minW={0} gap={respuesta ? 2 : 0}>
        <Text color={respuesta ? '$textoSecundario' : '$texto'} fontSize={respuesta ? 12 : 15} numberOfLines={1}>
          {pregunta}
        </Text>
        {respuesta ? (
          <Text color="$texto" fontSize={15} fontWeight="500" numberOfLines={1}>
            {respuesta}
          </Text>
        ) : null}
      </YStack>
      <Feather
        name={respuesta ? 'check' : 'chevron-down'}
        size={18}
        color={respuesta ? tema.disponible?.val : tema.textoSecundario?.val}
      />
    </XStack>
  )
}
