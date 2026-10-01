import { useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Keyboard, Platform, StyleSheet, TextInput } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

/** Largo de los códigos que se escriben aquí, como el que llega por SMS al entrar. */
const DIGITOS = 6

export type CajitasDeCodigoRef = {
  /** Pone el foco en el campo y abre el teclado, por ejemplo para escribir otro código después de uno incorrecto. */
  enfocar: () => void
}

type Props = {
  ref?: Ref<CajitasDeCodigoRef>
  /** Los dígitos escritos, de ninguno a seis. */
  valor: string
  onCambiar: (valor: string) => void
  /** Se llama al escribir el sexto dígito, con el código completo. */
  onCompletar?: (codigo: string) => void
  /** Pinta las cajitas con el color de error del tema. */
  error?: boolean
  autoFocus?: boolean
  /** Lo que dice el lector de pantalla al llegar al campo. */
  accessibilityLabel: string
}

/**
 * Seis cajitas para escribir un código numérico, que Tamagui no trae. Lo que se escribe lo recibe un único `TextInput`,
 * oculto debajo de las cajitas: con un campo por cajita se rompen pegar el código, borrar hacia atrás y el autocompletado
 * del sistema. Las cajitas solo muestran los dígitos y, al tocarlas, le pasan el foco al campo.
 */
export function CajitasDeCodigo({
  ref,
  valor,
  onCambiar,
  onCompletar,
  error = false,
  autoFocus = false,
  accessibilityLabel,
}: Props) {
  const campo = useRef<TextInput>(null)
  const [enfocado, setEnfocado] = useState(false)

  function enfocar() {
    // Android cierra el teclado con "atrás" sin quitarle el foco al campo, y entonces focus() no hace nada: se suelta
    // antes para que el teclado vuelva a abrirse.
    if (!Keyboard.isVisible()) {
      campo.current?.blur()
    }
    campo.current?.focus()
  }

  useImperativeHandle(ref, () => ({ enfocar }))

  function alEscribir(texto: string) {
    // Lo que se pega o lo que completa el sistema puede traer espacios, guiones o el código repetido: quedan los
    // primeros seis dígitos. Por eso el campo no lleva maxLength, que cortaría el texto antes de limpiarlo.
    const codigo = texto.replace(/\D/g, '').slice(0, DIGITOS)
    if (codigo === valor) {
      return
    }
    onCambiar(codigo)
    if (codigo.length === DIGITOS) {
      // Completo no queda nada por escribir: el teclado se cierra y deja ver lo que sigue en la pantalla.
      campo.current?.blur()
      onCompletar?.(codigo)
    }
  }

  // La cajita que toca escribir. Con el código completo es la última, que es la que se borra primero.
  const actual = Math.min(valor.length, DIGITOS - 1)

  return (
    <YStack>
      <TextInput
        ref={campo}
        value={valor}
        onChangeText={alEscribir}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        // El sistema ofrece completar el código del SMS recibido: Android con autoComplete y iOS con textContentType.
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        accessibilityLabel={accessibilityLabel}
        style={[StyleSheet.absoluteFill, estilos.campoOculto]}
      />
      {/* Para el lector de pantalla el campo es el que habla: las cajitas repetirían lo mismo. */}
      <XStack gap={4} justify="space-between" onPress={enfocar} aria-hidden>
        {Array.from({ length: DIGITOS }, (_, indice) => {
          const resaltada = enfocado && indice === actual
          return (
            <YStack
              key={indice}
              // Con el margen de 24 de las pantallas, en un teléfono de 360 de ancho no bajan de 48; en uno más
              // angosto se achican en vez de salirse.
              width={50}
              height={56}
              flexShrink={1}
              rounded={12}
              items="center"
              justify="center"
              bg={error ? '$primarioTinte' : '$superficie'}
              borderWidth={resaltada ? 2 : 1}
              borderColor={error ? '$primario' : resaltada ? '$texto' : '$bordeFuerte'}
            >
              <Text color="$texto" fontFamily="$mono" fontSize={24} fontWeight="500">
                {valor[indice] ?? ''}
              </Text>
            </YStack>
          )
        })}
      </XStack>
    </YStack>
  )
}

const estilos = StyleSheet.create({
  // Ocupa el lugar de las cajitas, debajo de ellas, para que el lector de pantalla y el autocompletado lo encuentren
  // ahí. En iOS una opacidad de 0 lo saca del lector de pantalla: queda casi invisible y con el texto transparente.
  campoOculto: Platform.select({
    ios: { opacity: 0.02, color: 'transparent' },
    default: { opacity: 0 },
  }),
})
