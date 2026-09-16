import Feather from '@expo/vector-icons/Feather'
import { H1, Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import { cronometro, horaCorta, segundosDesde } from '@/shared/formato/tiempo'

type Props = {
  enviadaEn?: string
  origen?: string
  sinTiempoReal: boolean
  ahora: number
}

/**
 * El incidente sigue sin unidades. Manda la confirmación de que la alerta salió; el cronómetro de PB-06 CA-01 sigue
 * corriendo debajo, en chico, porque el tiempo que pasa no es una buena noticia que destacar.
 */
export function HojaBuscando({ enviadaEn, origen, sinTiempoReal, ahora }: Props) {
  const tema = useTheme()

  return (
    <YStack gap={14}>
      <XStack items="center" gap={12}>
        <YStack width={44} height={44} shrink={0} rounded={999} bg="$disponibleTinte" items="center" justify="center">
          <Feather name="check" size={22} color={tema.disponibleTexto?.val} />
        </YStack>
        <YStack flex={1} minW={0} gap={2}>
          <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            Tu alerta salió
          </H1>
          {enviadaEn ? (
            <Text color="$textoSecundario" fontSize={14}>
              {`Enviada a las ${horaCorta(enviadaEn)}`}
            </Text>
          ) : null}
        </YStack>
      </XStack>

      {origen ? (
        <Text color="$textoTenue" fontSize={13} lineHeight={18}>
          {origen === 'MANUAL' ? 'Con el punto que marcaste en el mapa.' : 'Con tu ubicación del GPS.'}
        </Text>
      ) : null}

      {/* PB-06 CA-01: el tiempo transcurrido desde la emisión, aumentando. */}
      <XStack items="center" gap={8}>
        <Feather name="clock" size={15} color={tema.textoSecundario?.val} />
        {enviadaEn ? (
          <Text color="$textoSecundario" fontFamily="$mono" fontSize={14} aria-live="polite">
            {cronometro(segundosDesde(enviadaEn, ahora))}
          </Text>
        ) : null}
        <Text color="$textoSecundario" fontSize={14}>
          {enviadaEn ? '· Buscando unidad' : 'Buscando unidad'}
        </Text>
      </XStack>

      <Paragraph color="$textoSecundario" fontSize={15} lineHeight={22}>
        Tu alerta llegó a todas las unidades disponibles. Esta pantalla cambia sola cuando una tome tu caso.
      </Paragraph>

      {sinTiempoReal ? (
        <Paragraph color="$enAtencionTexto" fontSize={14} lineHeight={20}>
          No pudimos conectar con el seguimiento en tiempo real. Revisa tu conexión.
        </Paragraph>
      ) : null}
    </YStack>
  )
}
