import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Input, Paragraph, Sheet, Text, XStack, YStack, useToastController } from 'tamagui'

import { obtenerUbicacionGps } from '@/features/alerta/ubicacion'
import { personasQuery } from '@/features/personas/queries'
import { ciudadanoQuery } from '@/features/registro/queries'
import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { CentroSalud, Movilidad } from './api'
import { centrosSaludQuery, pedirTrasladoMutation } from './queries'
import { DETALLE_MOVILIDAD, TEXTO_MOVILIDAD } from './textos'

const MOVILIDADES: Movilidad[] = ['CAMINA_CON_AYUDA', 'SILLA_DE_RUEDAS', 'CAMILLA']

type Hoja = 'quien' | 'como' | 'destino' | null

/**
 * Una sola pantalla con filas: cada una abre lo que necesita y vuelve. Esta misma pantalla es la revisión, así
 * que no hay un paso de confirmar aparte ni hay que ir para atrás por todos los pasos para corregir algo.
 */
export function PantallaPedirTraslado() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const ciudadano = useQuery(ciudadanoQuery()).data
  const personas = useQuery(personasQuery())
  const centros = useQuery(centrosSaludQuery())
  const pedir = useMutation(pedirTrasladoMutation(queryClient))

  const [hoja, setHoja] = useState<Hoja>(null)
  const [pasajeroId, setPasajeroId] = useState<number | null>(null)
  const [movilidad, setMovilidad] = useState<Movilidad>('CAMINA_CON_AYUDA')
  const [oxigeno, setOxigeno] = useState(false)
  const [equipo, setEquipo] = useState(false)
  const [centro, setCentro] = useState<CentroSalud | null>(null)
  const [referencia, setReferencia] = useState('')

  const pasajero = pasajeroId === null ? ciudadano?.nombreCompleto : personas.data?.find((p) => p.id === pasajeroId)?.nombreCompleto

  async function enviar() {
    const ubicacion = await obtenerUbicacionGps()
    if (!ubicacion) {
      toast.show('No pudimos ubicarte', { message: 'Encendé la ubicación para pedir el traslado.' })
      return
    }
    if (!centro) {
      toast.show('Falta el destino', { message: 'Elegí a qué centro de salud va.' })
      return
    }
    pedir.mutate(
      {
        pasajeroId,
        movilidad,
        oxigeno,
        equipo,
        aislamiento: false,
        acompanantes: 0,
        origenLatitud: ubicacion.latitud,
        origenLongitud: ubicacion.longitud,
        origenReferencia: referencia.trim() || null,
        centroSaludDestinoId: centro.id,
      },
      {
        onSuccess: () => {
          toast.show('Traslado pedido', { message: 'Te avisamos cuando tengamos la unidad.' })
          router.back()
        },
        onError: (error) => toast.show('No se pudo pedir', { message: mensajeDeError(error) }),
      },
    )
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: margenes.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}
      >
        <YStack gap={20}>
          <YStack gap={4}>
            <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
              Pedir traslado
            </H1>
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              Se busca una unidad cuando llega la hora de salir. Te avisamos apenas la tengamos.
            </Paragraph>
          </YStack>

          <YStack rounded={14} borderWidth={1} borderColor="$borde" overflow="hidden">
            <Fila etiqueta="Quién viaja" valor={pasajero ?? 'Elegir'} onPress={() => setHoja('quien')} />
            <Fila
              etiqueta="Cómo viaja"
              valor={`${TEXTO_MOVILIDAD[movilidad]}${oxigeno ? ' · Oxígeno' : ''}${equipo ? ' · Equipo' : ''}`}
              onPress={() => setHoja('como')}
            />
            <Fila etiqueta="A dónde" valor={centro?.nombre ?? 'Elegir'} onPress={() => setHoja('destino')} ultima />
          </YStack>

          <YStack gap={6}>
            <Text fontSize={13} fontWeight="600" color="$texto">
              Referencia del lugar de recogida
            </Text>
            <Input
              size="$4"
              placeholder="Portón verde, casa de dos pisos"
              value={referencia}
              onChangeText={setReferencia}
            />
            <Text fontSize={12} lineHeight={17} color="$textoSecundario">
              Tomamos tu ubicación actual como punto de recogida. La referencia es lo que hace que la ambulancia
              encuentre la puerta.
            </Text>
          </YStack>

          <BotonPrincipal disabled={pedir.isPending} opacity={pedir.isPending ? 0.6 : 1} onPress={enviar}>
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Pedir traslado
            </Button.Text>
          </BotonPrincipal>
        </YStack>
      </ScrollView>

      <HojaElegir abierta={hoja !== null} onCerrar={() => setHoja(null)}>
        {hoja === 'quien' ? (
          <>
            <Titulo>¿Quién viaja?</Titulo>
            <Opcion
              titulo="Yo"
              detalle={ciudadano?.nombreCompleto ?? ''}
              elegida={pasajeroId === null}
              onPress={() => {
                setPasajeroId(null)
                setHoja(null)
              }}
            />
            {(personas.data ?? []).map((persona) => (
              <Opcion
                key={persona.id}
                titulo={persona.nombreCompleto}
                detalle={persona.telefono}
                elegida={pasajeroId === persona.id}
                onPress={() => {
                  setPasajeroId(persona.id)
                  setHoja(null)
                }}
              />
            ))}
            <Text fontSize={12} lineHeight={17} color="$textoSecundario">
              Para agregar a alguien, entrá a Menú. Queda guardado para los próximos pedidos.
            </Text>
          </>
        ) : null}

        {hoja === 'como' ? (
          <>
            <Titulo>¿Cómo viaja?</Titulo>
            {MOVILIDADES.map((opcion) => (
              <Opcion
                key={opcion}
                titulo={TEXTO_MOVILIDAD[opcion]}
                detalle={DETALLE_MOVILIDAD[opcion]}
                elegida={movilidad === opcion}
                onPress={() => setMovilidad(opcion)}
              />
            ))}
            <Opcion titulo="Necesita oxígeno" detalle="" elegida={oxigeno} onPress={() => setOxigeno(!oxigeno)} />
            <Opcion
              titulo="Tiene vía, sonda u otro equipo"
              detalle=""
              elegida={equipo}
              onPress={() => setEquipo(!equipo)}
            />
            <Text fontSize={12} lineHeight={17} color="$textoSecundario">
              Con esto elegimos la unidad que corresponde. Es de este viaje: si cambia, en el próximo lo volvés a
              elegir.
            </Text>
          </>
        ) : null}

        {hoja === 'destino' ? (
          <>
            <Titulo>¿A dónde va?</Titulo>
            {(centros.data ?? []).map((opcion) => (
              <Opcion
                key={opcion.id}
                titulo={opcion.nombre}
                detalle={opcion.direccion ?? ''}
                elegida={centro?.id === opcion.id}
                onPress={() => {
                  setCentro(opcion)
                  setHoja(null)
                }}
              />
            ))}
            {centros.data?.length === 0 ? (
              <Text fontSize={13} lineHeight={18} color="$textoSecundario">
                Todavía no hay centros de salud cargados.
              </Text>
            ) : null}
          </>
        ) : null}
      </HojaElegir>
    </>
  )
}

function Fila({
  etiqueta,
  valor,
  onPress,
  ultima = false,
}: {
  etiqueta: string
  valor: string
  onPress: () => void
  ultima?: boolean
}) {
  return (
    <XStack
      items="center"
      gap={10}
      px={14}
      py={12}
      bg="$superficie"
      borderBottomWidth={ultima ? 0 : 1}
      borderColor="$borde"
      pressStyle={{ bg: '$fondo' }}
      onPress={onPress}
    >
      <YStack flex={1} gap={2} minW={0}>
        <Text fontSize={11} fontWeight="600" color="$textoTenue" letterSpacing={0.5}>
          {etiqueta.toUpperCase()}
        </Text>
        <Text fontSize={15} fontWeight="500" color="$texto" numberOfLines={1}>
          {valor}
        </Text>
      </YStack>
      <Text fontSize={18} color="$textoTenue">
        ›
      </Text>
    </XStack>
  )
}

function HojaElegir({
  abierta,
  onCerrar,
  children,
}: {
  abierta: boolean
  onCerrar: () => void
  children: React.ReactNode
}) {
  return (
    <Sheet modal open={abierta} onOpenChange={(valor: boolean) => !valor && onCerrar()} snapPointsMode="fit" dismissOnSnapToBottom>
      <Sheet.Overlay bg="$velo" />
      <Sheet.Frame bg="$superficie" p={20} gap={10} borderTopLeftRadius={20} borderTopRightRadius={20}>
        {children}
        <Button size="$4" chromeless onPress={onCerrar}>
          <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
            Listo
          </Button.Text>
        </Button>
      </Sheet.Frame>
    </Sheet>
  )
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize={17} fontWeight="600" color="$texto">
      {children}
    </Text>
  )
}

function Opcion({
  titulo,
  detalle,
  elegida,
  onPress,
}: {
  titulo: string
  detalle: string
  elegida: boolean
  onPress: () => void
}) {
  return (
    <YStack
      gap={2}
      px={14}
      py={12}
      rounded={12}
      borderWidth={1}
      borderColor={elegida ? '$primario' : '$borde'}
      bg={elegida ? '$primarioTinte' : 'transparent'}
      pressStyle={{ bg: '$fondo' }}
      onPress={onPress}
    >
      <Text fontSize={15} fontWeight="600" color="$texto">
        {titulo}
      </Text>
      {detalle ? (
        <Text fontSize={13} lineHeight={18} color="$textoSecundario">
          {detalle}
        </Text>
      ) : null}
    </YStack>
  )
}
