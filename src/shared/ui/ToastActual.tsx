import { Toast, useToastState, YStack } from 'tamagui'

/** Pinta el aviso que se muestre con `useToastController().show(titulo, { message })`. */
export function ToastActual() {
  const actual = useToastState()
  if (!actual || actual.isHandledNatively) {
    return null
  }
  return (
    <Toast
      key={actual.id}
      duration={actual.duration}
      viewportName={actual.viewportName}
      enterStyle={{ opacity: 0, y: -20 }}
      exitStyle={{ opacity: 0, y: -20 }}
      opacity={1}
      y={0}
      transition="quick"
      bg="$texto"
      rounded={14}
      mx={16}
      px={16}
      py={12}
    >
      <YStack gap={2}>
        <Toast.Title color="$fondo" fontWeight="600">
          {actual.title}
        </Toast.Title>
        {actual.message ? <Toast.Description color="$textoTenue">{actual.message}</Toast.Description> : null}
      </YStack>
    </Toast>
  )
}
