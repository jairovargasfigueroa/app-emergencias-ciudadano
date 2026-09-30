import { Button, H1, Paragraph, Spinner, YStack } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MensajeDeCampo } from '@/shared/ui/MensajeDeCampo'

type Props = {
  /** Si la llamada al servidor está en curso. */
  ingresando: boolean
  /** Por qué no se pudo entrar, dicho para la persona. */
  aviso: string | null
  onReintentar: () => void
  onCambiarNumero: () => void
}

/**
 * El número ya quedó verificado y falta que el servidor abra la sesión. Si no pudo (sin conexión, o el servidor no pudo
 * verificar en ese momento), se reintenta con la misma verificación: otro SMS no cambiaría nada.
 */
export function PasoVerificado({ ingresando, aviso, onReintentar, onCambiarNumero }: Props) {
  return (
    <YStack flex={1}>
      <YStack gap={10} mt={28}>
        <H1 color="$texto" fontSize={28} lineHeight={34} fontWeight="600">
          Número verificado
        </H1>
        <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24} aria-live="polite">
          {ingresando ? 'Estamos abriendo tu cuenta…' : 'No hace falta otro código: vuelve a intentarlo para entrar.'}
        </Paragraph>
      </YStack>

      <YStack flex={1} minH={32} />

      <YStack gap={8}>
        {ingresando ? null : <MensajeDeCampo texto={aviso} />}
        <BotonPrincipal
          disabled={ingresando}
          opacity={ingresando ? 0.7 : 1}
          icon={ingresando ? <Spinner color="$primarioTexto" /> : undefined}
          onPress={onReintentar}
        >
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            {ingresando ? 'Entrando…' : 'Reintentar'}
          </Button.Text>
        </BotonPrincipal>
        <Button height={44} chromeless disabled={ingresando} onPress={onCambiarNumero}>
          <Button.Text color="$primario" fontSize={15} fontWeight="600">
            Usar otro número
          </Button.Text>
        </Button>
      </YStack>
    </YStack>
  )
}
