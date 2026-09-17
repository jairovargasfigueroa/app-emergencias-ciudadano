import Feather from '@expo/vector-icons/Feather'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Paragraph, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import { completarDetallesMutation } from '@/features/alerta/queries'
import { ciudadanoQuery } from '@/features/registro/queries'
import { ErrorApi } from '@/shared/api/cliente'

import {
  detallesDeRespuestas,
  hayRespuestas,
  LARGO_MAXIMO_OTRO,
  OPCIONES_AFECTADOS,
  PARA_QUIEN,
  SIN_RESPUESTAS,
  TIPO_OTRO,
  TIPOS_DE_EMERGENCIA,
} from './preguntas'
import { seguimientoEnCursoQuery } from './queries'

/**
 * PB-02 R3: para quién es la ayuda, qué pasó y cuántas personas la necesitan, todo opcional. Se pregunta durante la
 * espera y sale en un solo envío contra `POST /alertas/{alertaId}/detalles`; una vez enviado ya no se edita.
 */
export function PreguntasIncidente({ alertaId }: { alertaId: number }) {
  const queryClient = useQueryClient()
  const ciudadano = useQuery(ciudadanoQuery()).data
  const enCurso = useQuery(seguimientoEnCursoQuery()).data
  const completar = useMutation(completarDetallesMutation(queryClient))

  const form = useForm({
    defaultValues: SIN_RESPUESTAS,
    onSubmit: ({ value }) => {
      const detalles = detallesDeRespuestas(value)
      if (ciudadano && hayRespuestas(detalles) && !completar.isPending) {
        completar.mutate({ ciudadanoId: ciudadano.id, alertaId, detalles })
      }
    },
  })

  // Los detalles nunca bloquean nada: si el servidor ya no los acepta, la sección desaparece sin decir nada.
  const yaNoSeAceptan = completar.error instanceof ErrorApi && completar.error.status === 409
  if (!ciudadano || yaNoSeAceptan) {
    return null
  }

  // Una sola vez por alerta: cuenta lo enviado desde esta pantalla y lo anotado antes de cerrar la app.
  if (completar.isSuccess || (enCurso?.alertaId === alertaId && enCurso.detallesEnviados)) {
    return <DatosEnviados />
  }

  return (
    <YStack gap={10}>
      <Text color="$textoTenue" fontSize={12} fontWeight="500">
        Opcional · ayuda a quien te atiende
      </Text>

      <YStack gap={18} p={16} rounded={16} borderWidth={1} borderColor="$borde" bg="$superficie">
        <form.Field name="paraQuien">
          {(campo) => (
            <YStack gap={10}>
              <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
                ¿Para quién es la ayuda?
              </Text>
              <XStack flexWrap="wrap" gap={8} role="radiogroup" aria-label="Para quién es la ayuda">
                {PARA_QUIEN.map((opcion) => (
                  <Opcion
                    key={opcion.id}
                    texto={opcion.texto}
                    elegida={campo.state.value === opcion.id}
                    onPress={() => campo.handleChange(opcion.id)}
                  />
                ))}
              </XStack>
            </YStack>
          )}
        </form.Field>

        <form.Field name="tipo">
          {(campo) => (
            <YStack gap={10}>
              <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
                ¿Qué pasó?
              </Text>
              <XStack flexWrap="wrap" gap={8} role="radiogroup" aria-label="Qué pasó">
                {TIPOS_DE_EMERGENCIA.map((opcion) => (
                  <Opcion
                    key={opcion.id}
                    // "…" avisa que esa opción pide escribir algo más.
                    texto={opcion.id === TIPO_OTRO ? `${opcion.texto}…` : opcion.texto}
                    etiqueta={opcion.texto}
                    elegida={campo.state.value === opcion.id}
                    onPress={() => campo.handleChange(opcion.id)}
                  />
                ))}
              </XStack>
              {campo.state.value === TIPO_OTRO ? (
                <form.Field name="otro">
                  {(campoOtro) => (
                    <Input
                      value={campoOtro.state.value}
                      onChangeText={campoOtro.handleChange}
                      onBlur={campoOtro.handleBlur}
                      placeholder="Cuéntalo en pocas palabras"
                      placeholderTextColor="$textoTenue"
                      maxLength={LARGO_MAXIMO_OTRO}
                      height={48}
                      rounded={12}
                      fontSize={15}
                      bg="$fondo"
                      borderColor="$borde"
                      returnKeyType="done"
                      aria-label="Qué pasó, en pocas palabras"
                    />
                  )}
                </form.Field>
              ) : null}
            </YStack>
          )}
        </form.Field>

        <form.Field name="afectados">
          {(campo) => (
            <YStack gap={10}>
              <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
                ¿Cuántas personas necesitan ayuda?
              </Text>
              <XStack gap={8} role="radiogroup" aria-label="Cuántas personas necesitan ayuda">
                {OPCIONES_AFECTADOS.map((opcion) => (
                  <Opcion
                    key={opcion.valor}
                    texto={opcion.texto}
                    etiqueta={opcion.etiqueta}
                    elegida={campo.state.value === opcion.valor}
                    parejo
                    onPress={() => campo.handleChange(opcion.valor)}
                  />
                ))}
              </XStack>
            </YStack>
          )}
        </form.Field>

        <YStack gap={8}>
          <form.Subscribe selector={(estado) => hayRespuestas(detallesDeRespuestas(estado.values))}>
            {(conRespuestas) => (
              <Button
                height={52}
                rounded={14}
                borderWidth={0}
                bg="$texto"
                pressStyle={{ bg: '$textoSecundario' }}
                disabled={!conRespuestas || completar.isPending}
                opacity={conRespuestas ? 1 : 0.35}
                icon={completar.isPending ? <Spinner color="$fondo" /> : undefined}
                aria-busy={completar.isPending}
                onPress={() => form.handleSubmit().catch(() => {})}
              >
                <Button.Text color="$fondo" fontSize={16} fontWeight="600">
                  {completar.isPending ? 'Enviando…' : 'Enviar'}
                </Button.Text>
              </Button>
            )}
          </form.Subscribe>
          {/* Cualquier otro error: el botón queda disponible para reintentar con las mismas respuestas. */}
          {completar.isError ? (
            <Paragraph color="$enAtencionTexto" fontSize={13} lineHeight={18} text="center" role="alert">
              No se pudieron enviar los datos
            </Paragraph>
          ) : null}
        </YStack>
      </YStack>
    </YStack>
  )
}

type PropsOpcion = {
  texto: string
  elegida: boolean
  /** Lo que lee el lector de pantalla si el texto visible no basta. */
  etiqueta?: string
  /** Reparte el ancho de la fila en partes iguales: para respuestas cortas, como los números. */
  parejo?: boolean
  onPress: () => void
}

/** Respuesta de un toque. Funciona como un botón de radio: elegir otra reemplaza la anterior. */
function Opcion({ texto, elegida, etiqueta, parejo = false, onPress }: PropsOpcion) {
  return (
    <Button
      flex={parejo ? 1 : undefined}
      height={44}
      px={parejo ? 0 : 14}
      rounded={12}
      borderWidth={1}
      bg={elegida ? '$primario' : '$fondo'}
      borderColor={elegida ? '$primario' : '$borde'}
      pressStyle={elegida ? { bg: '$primarioPresionado', borderColor: '$primarioPresionado' } : { bg: '$borde' }}
      role="radio"
      aria-checked={elegida}
      aria-label={etiqueta ?? texto}
      onPress={onPress}
    >
      <Button.Text color={elegida ? '$primarioTexto' : '$texto'} fontSize={15} fontWeight={elegida ? '600' : '500'}>
        {texto}
      </Button.Text>
    </Button>
  )
}

/** Los detalles ya salieron: solo queda la confirmación, sin nada que editar. */
function DatosEnviados() {
  const tema = useTheme()

  return (
    <XStack
      items="center"
      gap={8}
      px={16}
      py={14}
      rounded={14}
      borderWidth={1}
      borderColor="$borde"
      bg="$superficie"
      aria-live="polite"
    >
      <Text color="$texto" fontSize={15} fontWeight="500">
        Datos enviados
      </Text>
      <Feather name="check" size={18} color={tema.disponible?.val} />
    </XStack>
  )
}
