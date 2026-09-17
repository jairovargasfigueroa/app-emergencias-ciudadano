import { SafeAreaView } from 'react-native-safe-area-context'
import { H1, Paragraph, YStack } from 'tamagui'

export default function Inicio() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} bg="$fondo" items="center" justify="center" gap={8} px={24}>
        <H1 color="$texto" fontSize={28}>
          SGA Ciudadano
        </H1>
        <Paragraph color="$textoSecundario" text="center">
          Sistema de Gestión de Ambulancias
        </Paragraph>
      </YStack>
    </SafeAreaView>
  )
}
