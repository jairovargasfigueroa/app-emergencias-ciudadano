import Feather from '@expo/vector-icons/Feather'
import { useEffect, useEffectEvent, useState } from 'react'
import { Button, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import type { ArchivoDeEvidencia } from '@/features/evidencias/archivo'
import { DURACION_MAXIMA_AUDIO_S } from '@/features/evidencias/formatos'
import { useGrabadoraAudio } from '@/features/evidencias/useGrabadoraAudio'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

const TITULOS = {
  preparando: 'Preparando el micrófono…',
  grabando: 'Grabando',
  guardando: 'Guardando el audio…',
}

type Props = {
  onListo: (archivo: ArchivoDeEvidencia) => void
  onError: (error: unknown) => void
  /** La persona descartó el audio o no se pudo empezar: vuelve a las opciones. */
  onCerrar: () => void
}

/**
 * Grabación de un audio: empieza sola al abrirse, muestra cuánto lleva y cuánto queda, y un botón grande para
 * terminar. Al llegar a los dos minutos se corta y se envía lo grabado.
 */
export function GrabadoraAudio({ onListo, onError, onCerrar }: Props) {
  const tema = useTheme()
  const [guardando, setGuardando] = useState(false)
  const grabadora = useGrabadoraAudio({
    alTerminar: onListo,
    alFallar: (error) => {
      onError(error)
      onCerrar()
    },
  })

  // Se abre porque la persona tocó "Grabar audio": no se le pide un segundo toque para empezar. Si se cierra a medio
  // grabar, lo grabado se descarta.
  const alAbrir = useEffectEvent(() => void grabadora.empezar())
  const alCerrar = useEffectEvent(() => void grabadora.descartar())
  useEffect(() => {
    alAbrir()
    return () => alCerrar()
  }, [])

  // Si deja de grabar después de haber empezado, se está guardando: también pasa con el corte a los dos minutos.
  const etapa = guardando
    ? 'guardando'
    : grabadora.grabando
      ? 'grabando'
      : grabadora.segundos > 0
        ? 'guardando'
        : 'preparando'
  const quieto = etapa !== 'grabando'

  return (
    <YStack gap={14} p={16} rounded={14} borderWidth={1} borderColor="$primario" bg="$primarioTinte">
      <XStack items="center" gap={10}>
        {quieto ? <Spinner color="$primario" /> : <YStack width={12} height={12} rounded={999} bg="$primario" />}
        <Text color="$texto" fontSize={16} fontWeight="600">
          {TITULOS[etapa]}
        </Text>
      </XStack>

      <YStack gap={4}>
        <Text color="$texto" fontFamily="$mono" fontSize={32} lineHeight={38}>
          {reloj(grabadora.segundos)}
        </Text>
        <Text color="$textoSecundario" fontSize={14} lineHeight={20}>
          {`Habla con calma y cuenta lo que pasa. Puedes grabar hasta ${reloj(DURACION_MAXIMA_AUDIO_S)}.`}
        </Text>
      </YStack>

      <BotonPrincipal
        disabled={quieto}
        opacity={quieto ? 0.5 : 1}
        icon={<Feather name="square" size={18} color={tema.primarioTexto?.val} />}
        aria-label="Detener y enviar el audio"
        onPress={() => {
          setGuardando(true)
          void grabadora.detener()
        }}
      >
        <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
          Detener y enviar
        </Button.Text>
      </BotonPrincipal>

      <Button
        height={48}
        rounded={14}
        chromeless
        onPress={() => {
          void grabadora.descartar()
          onCerrar()
        }}
      >
        <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
          Descartar
        </Button.Text>
      </Button>
    </YStack>
  )
}

/** "1:05": minutos y segundos, como en cualquier grabadora. */
function reloj(segundos: number) {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}
