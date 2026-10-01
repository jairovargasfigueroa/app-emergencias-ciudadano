import Feather from '@expo/vector-icons/Feather'
import { useForm } from '@tanstack/react-form'
import { Button, Checkbox, H1, Input, Label, Paragraph, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'
import { z } from 'zod'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MensajeDeCampo, textoDeErrores } from '@/shared/ui/MensajeDeCampo'

import { PREFIJO_PAIS } from './numero'

/** Qué se hace con los datos de la persona, dicho corto y en claro. Es lo que acepta al crear su cuenta. */
const AVISO_DE_PRIVACIDAD = [
  {
    titulo: 'Qué datos usamos',
    texto: 'Tu nombre, tu número, tu ubicación cuando pides ayuda y los datos de tus traslados.',
  },
  {
    titulo: 'Para qué',
    texto: 'Para atender tu emergencia o tu traslado, y para que la central y la unidad puedan llamarte.',
  },
  {
    titulo: 'Quién los ve',
    texto: 'La central y la unidad que te atiende.',
  },
  {
    titulo: 'No los vendemos',
    texto: 'Tampoco los compartimos con terceros, salvo con el centro de salud que recibe al paciente.',
  },
]

const esquema = z.object({
  nombreCompleto: z.string().trim().min(1, 'Escribe tu nombre completo.').max(255, 'El nombre es demasiado largo.'),
  aceptaPrivacidad: z.boolean().refine((acepta) => acepta, 'Para crear tu cuenta, acepta el aviso de privacidad.'),
})

export type DatosDePrimeraVez = z.infer<typeof esquema>

type Props = {
  numero: string
  /** Lo que salió mal en el último intento, dicho para la persona. */
  aviso: string | null
  onEntrar: (datos: DatosDePrimeraVez) => Promise<void>
  onCambiarNumero: () => void
}

/**
 * La primera vez que se entra con un número, el servidor pide el nombre y el aviso de privacidad aceptado para crear
 * la cuenta. El número ya está verificado: no hace falta otro SMS.
 */
export function PasoNombre({ numero, aviso, onEntrar, onCambiarNumero }: Props) {
  const tema = useTheme()
  const form = useForm({
    defaultValues: { nombreCompleto: '', aceptaPrivacidad: false },
    validators: { onSubmit: esquema },
    onSubmit: ({ value }) => onEntrar(esquema.parse(value)),
  })

  return (
    <YStack flex={1}>
      <YStack gap={10} mt={28}>
        <H1 color="$texto" fontSize={28} lineHeight={34} fontWeight="600">
          ¿Cómo te llamas?
        </H1>
        <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
          {`Es la primera vez que entras con el ${PREFIJO_PAIS} ${numero}. Tu nombre identifica a quien pide ayuda; lo escribes una sola vez.`}
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
                autoFocus
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="done"
              />
              <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
            </YStack>
          )}
        </form.Field>

        <YStack gap={12} p={16} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
          <Text color="$texto" fontSize={15} lineHeight={20} fontWeight="600">
            Aviso de privacidad
          </Text>
          {AVISO_DE_PRIVACIDAD.map(({ titulo, texto }) => (
            <YStack key={titulo} gap={2}>
              <Text color="$texto" fontSize={14} lineHeight={20} fontWeight="500">
                {titulo}
              </Text>
              <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
                {texto}
              </Paragraph>
            </YStack>
          ))}
        </YStack>

        <form.Field name="aceptaPrivacidad">
          {(field) => (
            <YStack gap={8}>
              <XStack items="center" gap={12}>
                <Checkbox
                  id="aceptaPrivacidad"
                  size="$6"
                  bg="$superficie"
                  borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                  checked={field.state.value}
                  onCheckedChange={(marcado) => field.handleChange(marcado === true)}
                  activeTheme={null}
                  activeStyle={{ bg: '$primario', borderColor: '$primario' }}
                >
                  <Checkbox.Indicator>
                    <Feather name="check" size={18} color={tema.primarioTexto?.val} />
                  </Checkbox.Indicator>
                </Checkbox>
                {/* Tocar el texto también marca la casilla: es un blanco más fácil que la casilla sola. */}
                <Label htmlFor="aceptaPrivacidad" flex={1} color="$texto" fontSize={15} lineHeight={21}>
                  Leí y acepto el aviso de privacidad
                </Label>
              </XStack>
              <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
            </YStack>
          )}
        </form.Field>
      </YStack>

      <YStack flex={1} minH={32} />

      <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
        {([entrando]) => (
          <YStack gap={8}>
            <MensajeDeCampo texto={aviso} />
            <BotonPrincipal
              disabled={entrando}
              opacity={entrando ? 0.7 : 1}
              icon={entrando ? <Spinner color="$primarioTexto" /> : undefined}
              onPress={() => form.handleSubmit().catch(() => {})}
            >
              <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                Entrar
              </Button.Text>
            </BotonPrincipal>
            <Button height={44} chromeless disabled={entrando} onPress={onCambiarNumero}>
              <Button.Text color="$primario" fontSize={15} fontWeight="600">
                Usar otro número
              </Button.Text>
            </Button>
          </YStack>
        )}
      </form.Subscribe>
    </YStack>
  )
}
