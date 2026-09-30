import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Button, Input, Sheet, Text, YStack, useToastController } from 'tamagui'

import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { MensajeDeCampo } from '@/shared/ui/MensajeDeCampo'

import type { Traslado } from './api'
import { actualizarDetallesMutation } from './queries'
import { LIMITES } from './validacion'

type Props = {
  abierta: boolean
  traslado: Traslado
  onCerrar: () => void
}

/**
 * Corregir lo que ayuda a la tripulación a encontrar la puerta y a hablar con alguien. Nada de esto cambia una
 * decisión que el sistema ya tomó, así que se puede con la unidad en camino, que es justo cuando más sirve:
 * "el portón es el azul, no el verde" no puede obligar a cancelar y pedir de nuevo.
 */
export function HojaCorregirDetalles({ abierta, traslado, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const actualizar = useMutation(actualizarDetallesMutation(queryClient))

  const [referencia, setReferencia] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoTelefono, setContactoTelefono] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [intentado, setIntentado] = useState(false)

  // La lista se refresca sola cada medio minuto, así que `traslado` cambia de identidad mientras se escribe. Los
  // campos se cargan solo al abrir, y desde una ref, para que un refresco no borre lo que la persona ya tipeó.
  const guardado = useRef(traslado)
  guardado.current = traslado

  useEffect(() => {
    if (!abierta) {
      return
    }
    setReferencia(guardado.current.origenReferencia ?? '')
    setContactoNombre(guardado.current.contactoNombre ?? '')
    setContactoTelefono(guardado.current.contactoTelefono ?? '')
    setObservaciones(guardado.current.observaciones ?? '')
    setIntentado(false)
  }, [abierta])

  // El servidor exige el contacto entero o ninguno. Avisarlo acá evita un rechazo que llega sin decir qué falta.
  const contactoIncompleto = Boolean(contactoNombre.trim()) !== Boolean(contactoTelefono.trim())

  function guardar() {
    if (contactoIncompleto) {
      setIntentado(true)
      return
    }
    actualizar.mutate(
      {
        id: traslado.id,
        datos: {
          origenReferencia: referencia.trim() || null,
          contactoNombre: contactoNombre.trim() || null,
          contactoTelefono: contactoTelefono.trim() || null,
          observaciones: observaciones.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.show('Datos corregidos', { message: 'La tripulación los ve enseguida.' })
          onCerrar()
        },
        onError: (error) => toast.show('No se pudo guardar', { message: mensajeDeError(error) }),
      },
    )
  }

  return (
    <Sheet
      modal
      open={abierta}
      onOpenChange={(valor: boolean) => !valor && onCerrar()}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      moveOnKeyboardChange
    >
      <Sheet.Overlay bg="$velo" />
      <Sheet.Frame bg="$superficie" p={20} gap={14} borderTopLeftRadius={20} borderTopRightRadius={20}>
        <YStack gap={4}>
          <Text fontSize={17} fontWeight="600" color="$texto">
            Corregir los detalles
          </Text>
          <Text fontSize={13} lineHeight={18} color="$textoSecundario">
            Se puede cambiar aunque la unidad ya esté en camino.
          </Text>
        </YStack>

        <YStack gap={6}>
          <Text fontSize={13} fontWeight="600" color="$texto">
            Referencia del lugar de recogida
          </Text>
          <Input
            size="$4"
            placeholder="Portón verde, casa de dos pisos"
            maxLength={LIMITES.origenReferencia}
            value={referencia}
            onChangeText={setReferencia}
          />
          <Text fontSize={12} lineHeight={17} color="$textoSecundario">
            Es lo que hace que la ambulancia encuentre la puerta.
          </Text>
        </YStack>

        <YStack gap={10}>
          <Text fontSize={13} fontWeight="600" color="$texto">
            Quién recibe a la ambulancia
          </Text>
          <Input
            size="$4"
            placeholder="Nombre"
            maxLength={LIMITES.contactoNombre}
            value={contactoNombre}
            onChangeText={setContactoNombre}
          />
          <Input
            size="$4"
            placeholder="Teléfono"
            keyboardType="phone-pad"
            maxLength={LIMITES.contactoTelefono}
            value={contactoTelefono}
            onChangeText={setContactoTelefono}
          />
          <MensajeDeCampo
            texto={
              intentado && contactoIncompleto ? 'Pon el nombre y el teléfono, o deja los dos vacíos.' : null
            }
          />
          <Text fontSize={12} lineHeight={17} color="$textoSecundario">
            Déjalo vacío si vas a estar tú. Sirve cuando el que pide no es el que abre la puerta.
          </Text>
        </YStack>

        <YStack gap={6}>
          <Text fontSize={13} fontWeight="600" color="$texto">
            Observaciones
          </Text>
          <Input
            size="$4"
            placeholder="Algo más que la tripulación deba saber"
            maxLength={LIMITES.observaciones}
            value={observaciones}
            onChangeText={setObservaciones}
          />
        </YStack>

        <BotonPrincipal
          disabled={actualizar.isPending}
          opacity={actualizar.isPending ? 0.6 : 1}
          onPress={guardar}
        >
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Guardar
          </Button.Text>
        </BotonPrincipal>

        <Button size="$4" chromeless onPress={onCerrar}>
          <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
            Volver
          </Button.Text>
        </Button>
      </Sheet.Frame>
    </Sheet>
  )
}
