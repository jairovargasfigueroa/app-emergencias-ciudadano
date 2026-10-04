import Feather from '@expo/vector-icons/Feather'
import { Paragraph, XStack, YStack, useTheme } from 'tamagui'

// TODO(B15): confirmar el plazo de retención
/** Días que se guarda lo que envía el ciudadano antes de borrarse. Tiene que decir lo mismo que hace el servidor. */
const DIAS_DE_RETENCION = 90

/**
 * Qué se hace con lo que envía (B6): una foto o un audio pueden mostrar a otras personas heridas, y quien los manda
 * tiene que saber quién los ve, para qué y por cuánto tiempo. Se ve antes de capturar, en letra chica y sin
 * diálogos: informa sin frenar a nadie.
 */
export function NotaUsoDeDatos() {
  const tema = useTheme()

  return (
    <XStack gap={8}>
      <YStack pt={2}>
        <Feather name="lock" size={13} color={tema.textoSecundario?.val} />
      </YStack>
      <Paragraph flex={1} color="$textoSecundario" fontSize={12} lineHeight={17}>
        {'Lo que envíes lo verán el equipo de la ambulancia y la central para prepararse antes de llegar. '}
        {'Un sistema automático lo revisa para resumir lo que pasa. '}
        {`Se guarda ${DIAS_DE_RETENCION} días y después se borra. No se publica ni se usa para otra cosa.`}
      </Paragraph>
    </XStack>
  )
}
