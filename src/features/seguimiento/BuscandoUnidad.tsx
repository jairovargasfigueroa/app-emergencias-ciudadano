import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H1, Paragraph, Text, XStack, YStack } from 'tamagui'

import { cronometro, horaCorta, segundosDesde } from '@/shared/formato/tiempo'
import { useAhora } from '@/shared/reloj/useAhora'

type Props = {
  enviadaEn?: string
  origen?: string
  afectados?: string
  sinTiempoReal: boolean
}

/** PB-06 CA-01: el incidente sigue sin unidades. El cronómetro corre desde la emisión. */
export function BuscandoUnidad({ enviadaEn, origen, afectados, sinTiempoReal }: Props) {
  const margenes = useSafeAreaInsets()
  const ahora = useAhora()

  return (
    <YStack flex={1} bg="$fondo" px={24} pt={margenes.top + 20} pb={margenes.bottom + 24}>
      {enviadaEn ? (
        <Text self="center" color="$textoSecundario" fontSize={14}>
          {`Alerta enviada a las ${horaCorta(enviadaEn)}`}
        </Text>
      ) : null}

      <YStack flex={1} items="center" justify="center" gap={32}>
        <YStack width={236} height={236} items="center" justify="center">
          <YStack position="absolute" width={236} height={236} rounded={999} borderWidth={1} borderColor="$primario" opacity={0.2} />
          <YStack position="absolute" width={170} height={170} rounded={999} bg="$primarioTinte" />
          <YStack position="absolute" width={170} height={170} rounded={999} borderWidth={1} borderColor="$primario" opacity={0.3} />
          <YStack width={104} height={104} rounded={999} bg="$primario" items="center" justify="center">
            <MaterialCommunityIcons name="ambulance" size={48} color="#FFFFFF" />
          </YStack>
        </YStack>

        <YStack items="center" gap={10}>
          <H1 color="$texto" fontSize={28} lineHeight={34} fontWeight="600" text="center">
            Buscando unidad
          </H1>
          {enviadaEn ? (
            <Text color="$texto" fontFamily="$mono" fontSize={20} fontWeight="500" aria-live="polite">
              {cronometro(segundosDesde(enviadaEn, ahora))}
            </Text>
          ) : null}
          <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24} text="center" maxW={300}>
            Tu alerta llegó a todas las unidades disponibles. Esta pantalla cambia sola cuando una tome tu caso.
          </Paragraph>
          {sinTiempoReal ? (
            <Paragraph color="$enAtencionTexto" fontSize={14} lineHeight={20} text="center" maxW={300}>
              No pudimos conectar con el seguimiento en tiempo real. Revisa tu conexión.
            </Paragraph>
          ) : null}
        </YStack>
      </YStack>

      {origen || afectados ? (
        <YStack gap={12} p={18} rounded={16} borderWidth={1} borderColor="$borde" bg="$superficie">
          <Fila etiqueta="Ubicación" valor={origen === 'MANUAL' ? 'Pin en el mapa' : 'GPS'} />
          <YStack height={1} bg="$borde" />
          <Fila etiqueta="Personas afectadas" valor={afectados ? afectados : 'Sin reportar'} />
        </YStack>
      ) : null}
    </YStack>
  )
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <XStack items="center" justify="space-between" gap={12}>
      <Text color="$textoSecundario" fontSize={15}>
        {etiqueta}
      </Text>
      <Text color="$texto" fontSize={15} fontWeight="500">
        {valor}
      </Text>
    </XStack>
  )
}
