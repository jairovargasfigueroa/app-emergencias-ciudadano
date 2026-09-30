import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyboardAvoidingView, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Input, Label, Paragraph, Spinner, YStack, useToastController } from 'tamagui'
import { z } from 'zod'

import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MarcaSga } from '@/shared/ui/MarcaSga'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'

import { registrarCiudadanoMutation } from './queries'

const esquema = z.object({
  nombreCompleto: z.string().trim().min(1, 'Escribe tu nombre completo.').max(255, 'El nombre es demasiado largo.'),
  telefono: z.string().trim().min(1, 'Escribe tu teléfono.').max(255, 'El teléfono es demasiado largo.'),
})

/**
 * PB-02 R1 y CA-14: sin registro ligero no se habilita el botón de alerta. Al registrarse, el layout raíz
 * cambia solo a la pantalla del botón.
 */
export function PantallaRegistro() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const registrar = useMutation(registrarCiudadanoMutation(queryClient))

  const form = useForm({
    defaultValues: { nombreCompleto: '', telefono: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      try {
        await registrar.mutateAsync(esquema.parse(value))
      } catch (error) {
        toast.show('No se pudo completar el registro', { message: mensajeDeError(error) })
      }
    },
  })

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <YStack flex={1} bg="$fondo" px={24} pt={margenes.top + 32} pb={margenes.bottom + 24}>
          <MarcaSga tamano={48} />

          <YStack gap={10} mt={28}>
            <H1 color="$texto" fontSize={28} lineHeight={34} fontWeight="600">
              Antes de tu primera alerta
            </H1>
            <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
              Tu nombre y tu teléfono identifican a quien pide ayuda. Lo haces una sola vez.
            </Paragraph>
          </YStack>

          <YStack gap={18} mt={36}>
            <form.Field name="nombreCompleto">
              {(field) => (
                <YStack gap={8}>
                  <Label htmlFor="nombreCompleto" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                    Nombre completo
                  </Label>
                  <Input
                    id="nombreCompleto"
                    size="$5"
                    height={52}
                    rounded={12}
                    bg="$superficie"
                    borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                  />
                  <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                </YStack>
              )}
            </form.Field>

            <form.Field name="telefono">
              {(field) => (
                <YStack gap={8}>
                  <Label htmlFor="telefono" color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    size="$5"
                    height={52}
                    rounded={12}
                    bg="$superficie"
                    borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    returnKeyType="done"
                    onSubmitEditing={() => form.handleSubmit().catch(() => {})}
                  />
                  {field.state.meta.isValid ? (
                    <Paragraph color="$textoSecundario" fontSize={13} lineHeight={18}>
                      Te llamarán a este número si hace falta.
                    </Paragraph>
                  ) : (
                    <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                  )}
                </YStack>
              )}
            </form.Field>
          </YStack>

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
                  {registrar.isPaused ? 'Esperando conexión…' : 'Continuar'}
                </Button.Text>
              </BotonPrincipal>
            )}
          </form.Subscribe>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
