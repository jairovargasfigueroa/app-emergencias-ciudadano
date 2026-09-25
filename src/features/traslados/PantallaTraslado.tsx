import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Text, XStack, YStack, useToastController } from 'tamagui'

import { mensajeDeError } from '@/shared/api/cliente'

import { trasladoVigente, type Traslado } from './api'
import { cancelarTrasladoMutation, misTrasladosQuery } from './queries'
import { EXPLICACION_ESTADO, TEXTO_ESTADO, TEXTO_MOVILIDAD, TEXTO_TIPO_UNIDAD } from './textos'

/** El traslado sale de la lista que ya está en caché: no hay un endpoint de detalle para el ciudadano. */
export function PantallaTraslado() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const { trasladoId } = useLocalSearchParams<{ trasladoId: string }>()
  const traslados = useQuery(misTrasladosQuery())
  const cancelar = useMutation(cancelarTrasladoMutation(queryClient))

  const traslado = traslados.data?.find((item) => String(item.id) === trasladoId)

  if (!traslado) {
    return (
      <YStack flex={1} items="center" justify="center" px={24} gap={8}>
        <Text fontSize={16} fontWeight="600" color="$texto">
          No encontramos ese traslado
        </Text>
        <Button chromeless onPress={() => router.back()}>
          <Button.Text color="$textoSecundario" fontSize={15}>
            Volver
          </Button.Text>
        </Button>
      </YStack>
    )
  }

  function retirar() {
    cancelar.mutate(traslado!.id, {
      onSuccess: () => {
        toast.show('Traslado cancelado')
        router.back()
      },
      onError: (error) => toast.show('No se pudo cancelar', { message: mensajeDeError(error) }),
    })
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: margenes.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}
    >
      <YStack gap={20}>
        <YStack gap={4}>
          <Text fontSize={12} fontWeight="600" color="$textoTenue" letterSpacing={0.6}>
            {TEXTO_ESTADO[traslado.estado].toUpperCase()}
          </Text>
          <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            {traslado.pasajero}
          </H1>
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            {EXPLICACION_ESTADO[traslado.estado]}
          </Paragraph>
        </YStack>

        <YStack gap={10} p={16} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
          <Dato etiqueta="Cuándo" valor={cuando(traslado)} />
          <Dato etiqueta="Desde" valor={traslado.origenReferencia ?? 'Punto marcado en el mapa'} />
          <Dato etiqueta="Hasta" valor={traslado.centroSaludDestino ?? 'Punto marcado en el mapa'} />
          <Dato etiqueta="Cómo viaja" valor={TEXTO_MOVILIDAD[traslado.movilidad]} />
          <Dato etiqueta="Necesita" valor={necesita(traslado)} />
          <Dato etiqueta="Unidad" valor={TEXTO_TIPO_UNIDAD[traslado.tipoUnidad]} />
        </YStack>

        {trasladoVigente(traslado.estado) ? (
          <Button
            height={52}
            rounded={14}
            variant="outlined"
            disabled={cancelar.isPending}
            opacity={cancelar.isPending ? 0.6 : 1}
            onPress={retirar}
          >
            <Button.Text color="$primario" fontSize={16} fontWeight="600">
              Cancelar el traslado
            </Button.Text>
          </Button>
        ) : null}
      </YStack>
    </ScrollView>
  )
}

function cuando(traslado: Traslado) {
  if (!traslado.horaCita) {
    return 'Lo antes posible'
  }
  const fecha = new Date(traslado.horaCita)
  const dia = fecha.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })
  const hora = fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
  return `${dia}, tiene que estar a las ${hora}`
}

function necesita(traslado: Traslado) {
  const marcadas = [traslado.oxigeno ? 'oxígeno' : null, traslado.equipo ? 'vía o sonda' : null].filter(
    (texto): texto is string => texto !== null,
  )
  return marcadas.length === 0 ? 'Nada en particular' : marcadas.join(' · ')
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <XStack gap={12} items="flex-start">
      <Text fontSize={13} color="$textoSecundario" width={110}>
        {etiqueta}
      </Text>
      <Text fontSize={14} color="$texto" flex={1}>
        {valor}
      </Text>
    </XStack>
  )
}
