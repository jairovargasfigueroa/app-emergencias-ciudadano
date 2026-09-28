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

import { sePuedeCancelar, trasladoVigente, type Traslado } from './api'
import { cancelarTrasladoMutation, misTrasladosQuery } from './queries'
import { DialogoCancelarTraslado } from './DialogoCancelarTraslado'
import { HojaCorregirDetalles } from './HojaCorregirDetalles'
import { RutaDelTraslado } from './RutaDelTraslado'
import {
  EXPLICACION_ESTADO,
  TEXTO_ESTADO,
  TEXTO_ESTADO_UNIDAD,
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
  const [cancelando, setCancelando] = useState(false)

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
        setCancelando(false)
        toast.show('Traslado cancelado')
        router.back()
      },
      // Si la unidad llegó mientras la persona decidía, el servidor lo rechaza con el porqué y el detalle se
      // refresca solo: en vez del botón queda dicho con quién hablar.
      onError: (error) => {
        setCancelando(false)
        toast.show('No se pudo cancelar', { message: mensajeDeError(error) })
      },
    })
  }

  const recibe = quienRecibe(traslado)
  const ventana = ventanaDeRecogida(traslado, { conDia: true })
  const enQueVa = traslado.estadoUnidad ? TEXTO_ESTADO_UNIDAD[traslado.estadoUnidad] : undefined

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

          {/* Con una unidad a cargo, lo que se viene a mirar es en qué va: si todavía viene o si ya está en la
              puerta, que es también lo que decide si se puede cancelar. */}
          {enQueVa ? (
            <XStack items="center" gap={10} px={16} py={14} rounded={14} bg="$disponibleTinte">
              <Feather name="truck" size={20} color={tema.disponibleTexto?.val} />
              <Text fontSize={17} lineHeight={22} fontWeight="600" color="$disponibleTexto" flex={1}>
                {enQueVa}
              </Text>
            </XStack>
          ) : null}

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

              {sePuedeCancelar(traslado) ? (
                <Button height={52} rounded={14} variant="outlined" onPress={() => setCancelando(true)}>
                  <Button.Text color="$primario" fontSize={16} fontWeight="600">
                    Cancelar el traslado
                  </Button.Text>
                </Button>
              ) : (
                <YStack p={16} rounded={14} bg="$superficie" borderWidth={1} borderColor="$borde">
                  <Paragraph color="$texto" fontSize={14} lineHeight={20}>
                    La unidad ya llegó. Si no van a viajar, díselo a la tripulación.
                  </Paragraph>
                </YStack>
              )}
            </YStack>
          ) : null}
        </YStack>
      </ScrollView>

      <HojaCorregirDetalles abierta={corrigiendo} traslado={traslado} onCerrar={() => setCorrigiendo(false)} />
      <DialogoCancelarTraslado
        abierto={cancelando}
        enviando={cancelar.isPending}
        conUnidadEnCamino={traslado.estadoUnidad === 'EN_CAMINO'}
        onConfirmar={retirar}
        onCerrar={() => setCancelando(false)}
      />
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
  // El aislamiento se pide en el formulario y viaja al servidor: si no se lista acá, el ciudadano marca algo
  // que después no puede ni revisar ni corregir.
  const marcadas = [
    traslado.oxigeno ? 'oxígeno' : null,
    traslado.equipo ? 'vía o sonda' : null,
    traslado.aislamiento ? 'aislamiento' : null,
  ].filter((texto): texto is string => texto !== null)
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
