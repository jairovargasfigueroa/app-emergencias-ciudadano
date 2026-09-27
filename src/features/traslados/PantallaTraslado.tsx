import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Text, XStack, YStack, useTheme, useToastController } from 'tamagui'

import { mensajeDeError } from '@/shared/api/cliente'
import { diaNatural, horaCorta } from '@/shared/formato/tiempo'
import { Insignia } from '@/shared/ui/Insignia'

import { trasladoVigente, yaEsHoraDeSalir, type Traslado } from './api'
import { cancelarTrasladoMutation, misTrasladosQuery } from './queries'
import { HojaCorregirDetalles } from './HojaCorregirDetalles'
import { RutaDelTraslado } from './RutaDelTraslado'
import {
  EXPLICACION_ESTADO,
  TEXTO_ESTADO,
  TEXTO_MOVILIDAD,
  TEXTO_TIPO_UNIDAD,
  TONO_ESTADO,
  ventanaDeRecogida,
} from './textos'

/** El traslado sale de la lista que ya está en caché: no hay un endpoint de detalle para el ciudadano. */
export function PantallaTraslado() {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const { trasladoId } = useLocalSearchParams<{ trasladoId: string }>()
  const traslados = useQuery(misTrasladosQuery())
  const cancelar = useMutation(cancelarTrasladoMutation(queryClient))
  const [corrigiendo, setCorrigiendo] = useState(false)

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

  const recibe = quienRecibe(traslado)
  const ventana = yaEsHoraDeSalir(traslado.estado) ? ventanaDeRecogida(traslado) : null

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: margenes.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}
      >
        <YStack gap={20}>
          {/* La pantalla se abre con push sobre las pestañas y el stack no dibuja cabecera: sin esto solo se sale
              con el gesto del teléfono, que no todos conocen. */}
          <XStack>
            <Button
              width={48}
              height={48}
              p={0}
              rounded={999}
              bg="$superficie"
              borderColor="$borde"
              aria-label="Volver"
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={20} color={tema.texto?.val} />
            </Button>
          </XStack>

          {/* El estado va en la misma insignia que en la lista: se reconoce sin volver a leerlo. */}
          <YStack gap={8}>
            <XStack items="center" justify="space-between" gap={12}>
              <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600" flex={1} numberOfLines={2}>
                {traslado.pasajero}
              </H1>
              <Insignia tono={TONO_ESTADO[traslado.estado]}>{TEXTO_ESTADO[traslado.estado]}</Insignia>
            </XStack>
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              {EXPLICACION_ESTADO[traslado.estado]}
            </Paragraph>
          </YStack>

          {ventana ? (
            <YStack gap={6} p={16} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
              <Text fontSize={12} fontWeight="600" color="$textoTenue" letterSpacing={0.6}>
                VENTANA DE RECOGIDA
              </Text>
              <Text fontSize={20} lineHeight={26} fontWeight="600" color="$texto">
                {ventana}
              </Text>
              <Paragraph color="$textoSecundario" fontSize={13} lineHeight={18}>
                Es un rango, no una hora exacta. Conviene estar listo desde la primera hora.
              </Paragraph>
            </YStack>
          ) : null}

          {/* De dónde a dónde es lo que se viene a mirar, así que sale de la lista de datos y ocupa su propio
              bloque. El riel es el mismo de la tarjeta de la lista: se reconoce al abrirla. */}
          <YStack p={16} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
            <RutaDelTraslado
              origen={traslado.origenReferencia ?? 'Origen marcado en el mapa'}
              destino={traslado.centroSaludDestino ?? 'Destino marcado en el mapa'}
            />
          </YStack>

          <Bloque titulo="El viaje">
            <YStack gap={10}>
              <Dato etiqueta="Cuándo" valor={cuando(traslado)} />
              <Dato etiqueta="Cómo viaja" valor={TEXTO_MOVILIDAD[traslado.movilidad]} />
              <Dato etiqueta="Necesita" valor={necesita(traslado)} />
              <Dato etiqueta="Unidad" valor={TEXTO_TIPO_UNIDAD[traslado.tipoUnidad]} />
            </YStack>
          </Bloque>

          {/* Los dos son opcionales: sin ninguno no hay tarjeta, y sin contacto el título dice lo que de verdad
              hay dentro en vez de anunciar a alguien que no existe. */}
          {recibe || traslado.observaciones ? (
            <Bloque titulo={recibe ? 'Quién recibe' : 'Observaciones'}>
              <YStack gap={8}>
                {recibe ? (
                  <Text fontSize={15} lineHeight={21} color="$texto">
                    {recibe}
                  </Text>
                ) : null}
                {traslado.observaciones ? (
                  <Paragraph color={recibe ? '$textoSecundario' : '$texto'} fontSize={14} lineHeight={20}>
                    {traslado.observaciones}
                  </Paragraph>
                ) : null}
              </YStack>
            </Bloque>
          ) : null}

          {trasladoVigente(traslado.estado) ? (
            <YStack gap={20}>
              <YStack gap={8}>
                <Button height={52} rounded={14} variant="outlined" onPress={() => setCorrigiendo(true)}>
                  <Button.Text color="$texto" fontSize={16} fontWeight="600">
                    Corregir los detalles
                  </Button.Text>
                </Button>
                <Paragraph color="$textoSecundario" fontSize={12} lineHeight={17}>
                  La referencia, quién recibe y las observaciones se pueden cambiar aunque la unidad ya esté en
                  camino.
                </Paragraph>
              </YStack>

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
            </YStack>
          ) : null}
        </YStack>
      </ScrollView>

      <HojaCorregirDetalles abierta={corrigiendo} traslado={traslado} onCerrar={() => setCorrigiendo(false)} />
    </>
  )
}

/** "Hoy 10:00": la hora a la que tiene que estar allá. Sin cita, el pedido es para lo antes posible. */
function cuando(traslado: Traslado) {
  if (!traslado.horaCita) {
    return 'Lo antes posible'
  }
  return `${diaNatural(traslado.horaCita)} ${horaCorta(traslado.horaCita)}`
}

function necesita(traslado: Traslado) {
  const marcadas = [traslado.oxigeno ? 'oxígeno' : null, traslado.equipo ? 'vía o sonda' : null].filter(
    (texto): texto is string => texto !== null,
  )
  return marcadas.length === 0 ? 'Nada en particular' : marcadas.join(' · ')
}

/** El contacto viaja completo o vacío, pero llega en dos campos sueltos: se arma con lo que haya. */
function quienRecibe(traslado: Traslado) {
  const partes = [traslado.contactoNombre, traslado.contactoTelefono].filter(
    (parte): parte is string => parte !== null && parte !== '',
  )
  return partes.length > 0 ? partes.join(' · ') : null
}

/** Un grupo de datos con su título, para que la pantalla se lea por bloques y no como una lista de ocho renglones. */
function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <YStack gap={10}>
      <Text fontSize={12} fontWeight="600" color="$textoTenue" letterSpacing={0.6}>
        {titulo.toUpperCase()}
      </Text>
      <YStack p={16} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
        {children}
      </YStack>
    </YStack>
  )
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
