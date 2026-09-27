import { Text, XStack, YStack } from 'tamagui'

type Props = {
  origen: string
  destino: string
}

/**
 * De dónde a dónde, en dos líneas. En una sola el corte cae justo donde está lo que se busca —el nombre del
 * centro de salud— y hay que abrir el detalle para leerlo. El riel de puntos dice el orden sin ninguna palabra.
 */
export function RutaDelTraslado({ origen, destino }: Props) {
  return (
    <XStack gap={12}>
      <YStack items="center" pt={6}>
        <YStack width={10} height={10} rounded={999} borderWidth={2} borderColor="$bordeFuerte" />
        <YStack width={2} flex={1} minH={14} bg="$borde" />
        <YStack width={10} height={10} rounded={999} bg="$primario" />
      </YStack>

      <YStack flex={1} minW={0} gap={10}>
        <Text fontSize={15} lineHeight={20} color="$texto" numberOfLines={2}>
          {origen}
        </Text>
        <Text fontSize={15} lineHeight={20} color="$texto" fontWeight="600" numberOfLines={2}>
          {destino}
        </Text>
      </YStack>
    </XStack>
  )
}
