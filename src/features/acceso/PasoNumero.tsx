import { useForm } from '@tanstack/react-form'
import { Button, H1, Input, Label, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { z } from 'zod'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'

import { esNumeroValido, numeroNacional, PREFIJO_PAIS } from './numero'

const esquema = z.object({
  numero: z.string().refine(esNumeroValido, 'Escribe los 8 dígitos de tu celular.'),
})

type Props = {
  /** El número con el que se entró la última vez, o el que se acaba de escribir si se vuelve a cambiarlo. */
  inicial: string
  /** Lo que salió mal en el último intento, dicho para la persona. */
  aviso: string | null
  onEnviarCodigo: (numero: string) => Promise<void>
}

/** Primer paso del ingreso: el número al que Firebase manda el código por SMS. */
export function PasoNumero({ inicial, aviso, onEnviarCodigo }: Props) {
  const form = useForm({
    defaultValues: { numero: inicial },
    validators: { onSubmit: esquema },
    onSubmit: ({ value }) => onEnviarCodigo(value.numero),
  })

  return (
    <YStack flex={1}>
      <YStack gap={10} mt={28}>
        <H1 color="$texto" fontSize={28} lineHeight={34} fontWeight="600">
          Tu número
        </H1>
        <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
          Te mandaremos un código por SMS para confirmar que es tuyo. A este número te llamarán si pides ayuda.
        </Paragraph>
      </YStack>

      <form.Field name="numero">
        {(field) => (
          <YStack gap={8} mt={36}>
            <Label htmlFor="numero" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
              Número de celular
            </Label>
            <XStack gap={10}>
              <XStack
                height={52}
                px={14}
                rounded={12}
                bg="$superficie"
                borderWidth={1}
                borderColor="$bordeFuerte"
                items="center"
              >
                <Text color="$texto" fontSize={17}>
                  {PREFIJO_PAIS}
                </Text>
              </XStack>
              <Input
                id="numero"
                flex={1}
                size="$5"
                height={52}
                rounded={12}
                bg="$superficie"
                borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                value={field.state.value}
                // Sin maxLength: el teclado o lo que se pega pueden traer el +591 o guiones, y el límite cortaría el
                // número antes de limpiarlo.
                onChangeText={(texto) => field.handleChange(numeroNacional(texto).slice(0, 8))}
                onBlur={field.handleBlur}
                keyboardType="number-pad"
                autoComplete="tel-national"
                textContentType="telephoneNumber"
                returnKeyType="send"
                onSubmitEditing={() => form.handleSubmit().catch(() => {})}
              />
            </XStack>
            <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors) ?? aviso} />
          </YStack>
        )}
      </form.Field>

      <YStack flex={1} minH={32} />

      <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
        {([enviando]) => (
          <BotonPrincipal
            disabled={enviando}
            opacity={enviando ? 0.7 : 1}
            icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
            onPress={() => form.handleSubmit().catch(() => {})}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Enviar código
            </Button.Text>
          </BotonPrincipal>
        )}
      </form.Subscribe>
    </YStack>
  )
}
