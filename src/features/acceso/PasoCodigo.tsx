import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Button, H1, Input, Label, Paragraph, Spinner, YStack } from 'tamagui'
import { z } from 'zod'

import { useAhora } from '@/shared/reloj/useAhora'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'

import { PREFIJO_PAIS } from './numero'

/** Antes de este tiempo Firebase no manda otro SMS: el primero todavía puede llegar y su código sigue sirviendo. */
const ESPERA_PARA_REENVIAR_S = 60

const esquema = z.object({
  codigo: z.string().regex(/^\d{6}$/, 'Escribe los 6 dígitos del código.'),
})

type Props = {
  numero: string
  /** Cuándo se mandó el último SMS, en milisegundos: de ahí corre la espera para pedir otro. */
  enviadoEn: number
  /** Lo que salió mal en el último intento, dicho para la persona. */
  aviso: string | null
  onConfirmar: (codigo: string) => Promise<void>
  onReenviar: () => Promise<void>
  onCambiarNumero: () => void
}

/**
 * Segundo paso del ingreso: el código que llegó por SMS. Si Android verifica el número por su cuenta, la pantalla de
 * ingreso sigue sola y este paso ni se completa.
 */
export function PasoCodigo({ numero, enviadoEn, aviso, onConfirmar, onReenviar, onCambiarNumero }: Props) {
  const ahora = useAhora()
  const [reenviando, setReenviando] = useState(false)
  const faltan = Math.max(0, ESPERA_PARA_REENVIAR_S - Math.floor((ahora - enviadoEn) / 1000))

  const form = useForm({
    defaultValues: { codigo: '' },
    validators: { onSubmit: esquema },
    onSubmit: ({ value }) => onConfirmar(value.codigo),
  })

  async function reenviar() {
    setReenviando(true)
    await onReenviar()
    setReenviando(false)
  }

  return (
    <YStack flex={1}>
      <YStack gap={10} mt={28}>
        <H1 color="$texto" fontSize={28} lineHeight={34} fontWeight="600">
          Escribe el código
        </H1>
        <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
          {`Te lo mandamos por SMS al ${PREFIJO_PAIS} ${numero}.`}
        </Paragraph>
      </YStack>

      <form.Field name="codigo">
        {(field) => (
          <YStack gap={8} mt={36}>
            <Label htmlFor="codigo" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
              Código de 6 dígitos
            </Label>
            <Input
              id="codigo"
              size="$5"
              height={52}
              rounded={12}
              bg="$superficie"
              borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
              value={field.state.value}
              onChangeText={(texto) => field.handleChange(texto.replace(/\D/g, ''))}
              onBlur={field.handleBlur}
              autoFocus
              maxLength={6}
              keyboardType="number-pad"
              // Android ofrece el código del SMS en el teclado; iOS, arriba del teclado.
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              returnKeyType="done"
              onSubmitEditing={() => form.handleSubmit().catch(() => {})}
            />
            <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors) ?? aviso} />
          </YStack>
        )}
      </form.Field>

      <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
        {([confirmando]) => (
          <>
            {/* Mientras se confirma no se cambia nada: el código es de este número y de este envío. */}
            <YStack items="flex-start" mt={16}>
              {faltan > 0 ? (
                <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} py={12}>
                  {`¿No te llegó? Puedes pedir otro en ${faltan} s.`}
                </Paragraph>
              ) : (
                <Button height={44} px={0} chromeless disabled={confirmando || reenviando} onPress={reenviar}>
                  <Button.Text color="$primario" fontSize={15} fontWeight="600">
                    {reenviando ? 'Enviando otro código…' : 'Reenviar el código'}
                  </Button.Text>
                </Button>
              )}
              <Button height={44} px={0} chromeless disabled={confirmando || reenviando} onPress={onCambiarNumero}>
                <Button.Text color="$primario" fontSize={15} fontWeight="600">
                  Cambiar el número
                </Button.Text>
              </Button>
            </YStack>

            <YStack flex={1} minH={32} />

            <BotonPrincipal
              disabled={confirmando || reenviando}
              opacity={confirmando || reenviando ? 0.7 : 1}
              icon={confirmando ? <Spinner color="$primarioTexto" /> : undefined}
              onPress={() => form.handleSubmit().catch(() => {})}
            >
              <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                Confirmar
              </Button.Text>
            </BotonPrincipal>
          </>
        )}
      </form.Subscribe>
    </YStack>
  )
}
