import Feather from '@expo/vector-icons/Feather'
import { Button, Text, XStack, YStack, useTheme } from 'tamagui'

import type { EvidenciaLocal } from '@/features/evidencias/cola'
import type { Modalidad } from '@/features/evidencias/formatos'

const MODALIDADES: Record<Modalidad, { nombre: string; icono: 'camera' | 'mic' | 'video' }> = {
  IMAGEN: { nombre: 'Foto', icono: 'camera' },
  AUDIO: { nombre: 'Audio', icono: 'mic' },
  VIDEO: { nombre: 'Video', icono: 'video' },
}

type Props = {
  evidencia: EvidenciaLocal
  /** "Foto 2": cuál de las de su tipo es, para distinguirlas en la lista. */
  numero: number
  onReintentar: () => void
  onQuitar: () => void
}

/** Una evidencia y cómo va su envío: avance mientras sube, y qué hacer si no salió. */
export function FilaEvidencia({ evidencia, numero, onReintentar, onQuitar }: Props) {
  const tema = useTheme()
  const { nombre, icono } = MODALIDADES[evidencia.archivo.modalidad]
  const porcentaje = Math.round(evidencia.avance * 100)
  const fallo = evidencia.estado === 'fallo'
  const enviada = evidencia.estado === 'enviada'

  return (
    <YStack gap={10} p={12} rounded={14} borderWidth={1} borderColor="$borde" bg="$fondo">
      <XStack items="center" gap={12}>
        <YStack width={40} height={40} shrink={0} rounded={10} bg="$superficie" items="center" justify="center">
          <Feather name={icono} size={19} color={tema.texto?.val} />
        </YStack>
        <YStack flex={1} minW={0} gap={2}>
          <Text color="$texto" fontSize={15} fontWeight="600">
            {`${nombre} ${numero}`}
          </Text>
          <Text
            color={fallo ? '$enAtencionTexto' : enviada ? '$disponibleTexto' : '$textoSecundario'}
            fontSize={13}
            lineHeight={18}
            aria-live="polite"
          >
            {textoDeEstado(evidencia, porcentaje)}
          </Text>
        </YStack>
        {enviada ? <Feather name="check" size={20} color={tema.disponible?.val} /> : null}
      </XStack>

      {evidencia.estado === 'subiendo' ? (
        <YStack
          height={6}
          rounded={999}
          bg="$borde"
          overflow="hidden"
          role="progressbar"
          aria-label={`Enviando ${nombre.toLowerCase()} ${numero}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={porcentaje}
        >
          <YStack height={6} width={`${porcentaje}%`} rounded={999} bg="$primario" />
        </YStack>
      ) : null}

      {fallo ? (
        <XStack gap={8}>
          {evidencia.reintentable ? (
            <Button
              flex={1}
              height={44}
              rounded={12}
              borderWidth={1}
              borderColor="$borde"
              bg="$superficie"
              pressStyle={{ bg: '$borde' }}
              icon={<Feather name="refresh-cw" size={16} color={tema.texto?.val} />}
              onPress={onReintentar}
            >
              <Button.Text color="$texto" fontSize={15} fontWeight="600">
                Reintentar
              </Button.Text>
            </Button>
          ) : null}
          <Button
            flex={evidencia.reintentable ? undefined : 1}
            height={44}
            px={16}
            rounded={12}
            chromeless
            aria-label={`Quitar ${nombre.toLowerCase()} ${numero}`}
            onPress={onQuitar}
          >
            <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
              Quitar
            </Button.Text>
          </Button>
        </XStack>
      ) : null}
    </YStack>
  )
}

function textoDeEstado(evidencia: EvidenciaLocal, porcentaje: number) {
  switch (evidencia.estado) {
    case 'subiendo':
      return porcentaje > 0 ? `Enviando… ${porcentaje} %` : 'Enviando…'
    case 'sin-senal':
      return 'Sin señal. Se envía sola cuando vuelva.'
    case 'reintentando':
      return 'Se cortó. Volvemos a intentar en un momento.'
    case 'enviada':
      return 'Enviada'
    case 'fallo':
      return evidencia.error ?? 'No se pudo enviar.'
  }
}
