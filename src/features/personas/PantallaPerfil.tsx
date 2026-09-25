import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Form, H1, Input, Paragraph, Text, XStack, YStack, useToastController } from 'tamagui'

import { ciudadanoQuery } from '@/features/registro/queries'
import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { personasQuery, registrarPersonaMutation } from './queries'

/**
 * Los datos del ciudadano y su gente: a quiénes traslada y a quiénes avisar. No son cuentas —esa señora no tiene
 * la app— así que el teléfono que se pone suele ser el de quien las registra, y eso está bien.
 */
export function PantallaPerfil() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const ciudadano = useQuery(ciudadanoQuery()).data
  const personas = useQuery(personasQuery())
  const registrar = useMutation(registrarPersonaMutation(queryClient))
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')

  function agregar() {
    if (!nombre.trim() || !telefono.trim()) {
      return
    }
    registrar.mutate(
      { nombreCompleto: nombre.trim(), telefono: telefono.trim() },
      {
        onSuccess: (persona) => {
          toast.show('Persona agregada', { message: `${persona.nombreCompleto} ya aparece al pedir un traslado.` })
          setNombre('')
          setTelefono('')
        },
        onError: (error) => toast.show('No se pudo agregar', { message: mensajeDeError(error) }),
      },
    )
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: margenes.top + 16, paddingBottom: 24, paddingHorizontal: 20 }}
    >
      <YStack gap={24}>
        <YStack gap={4}>
          <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600">
            Mi perfil
          </H1>
          {ciudadano ? (
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              {ciudadano.nombreCompleto} · {ciudadano.telefono}
            </Paragraph>
          ) : null}
        </YStack>

        <YStack gap={12}>
          <YStack gap={2}>
            <Text fontSize={16} fontWeight="600" color="$texto">
              Mis personas
            </Text>
            <Text fontSize={13} lineHeight={18} color="$textoSecundario">
              Familiares a los que trasladás y contactos de confianza. Quedan guardados para los próximos pedidos.
            </Text>
          </YStack>

          {(personas.data ?? []).map((persona) => (
            <YStack key={persona.id} gap={2} p={14} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
              <Text fontSize={15} fontWeight="600" color="$texto">
                {persona.nombreCompleto}
              </Text>
              <Text fontSize={13} color="$textoSecundario">
                {persona.telefono}
              </Text>
            </YStack>
          ))}

          {personas.data?.length === 0 ? (
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              Todavía no agregaste a nadie.
            </Paragraph>
          ) : null}
        </YStack>

        <Form gap={10} onSubmit={agregar}>
          <Text fontSize={13} fontWeight="600" color="$texto">
            Agregar una persona
          </Text>
          <Input size="$4" placeholder="Nombre y apellido" value={nombre} onChangeText={setNombre} />
          <Input
            size="$4"
            placeholder="Teléfono"
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
          />
          <XStack>
            <BotonPrincipal flex={1} disabled={registrar.isPending} opacity={registrar.isPending ? 0.6 : 1} onPress={agregar}>
              <Button.Text color="$primarioTexto" fontSize={15} fontWeight="600">
                Agregar
              </Button.Text>
            </BotonPrincipal>
          </XStack>
        </Form>
      </YStack>
    </ScrollView>
  )
}
