import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Input, Paragraph, Sheet, Text, XStack, YStack, useTheme, useToastController } from 'tamagui'

import { obtenerUbicacionGps, ultimaUbicacionReciente, type Coordenadas } from '@/features/alerta/ubicacion'
import { personasQuery } from '@/features/personas/queries'
import { ciudadanoQuery } from '@/features/registro/queries'
import { mensajeDeError } from '@/shared/api/cliente'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { CentroSalud, Movilidad } from './api'
import { centrosSaludQuery, pedirTrasladoMutation } from './queries'
import { MapaDelPedido, type PuntoActivo } from './MapaDelPedido'
import { SelectorDeCuando } from './SelectorDeCuando'
import { DETALLE_MOVILIDAD, TEXTO_MOVILIDAD, ventanaDeRecogida } from './textos'

const MOVILIDADES: Movilidad[] = ['CAMINA_CON_AYUDA', 'SILLA_DE_RUEDAS', 'CAMILLA']

type Hoja = 'quien' | 'como' | 'destino' | 'cuando' | null

/**
 * Una sola pantalla con filas: cada una abre lo que necesita y vuelve. Esta misma pantalla es la revisión, así
 * que no hay un paso de confirmar aparte ni hay que ir para atrás por todos los pasos para corregir algo.
 */
export function PantallaPedirTraslado() {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
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
  const [aislamiento, setAislamiento] = useState(false)
  const [origen, setOrigen] = useState<Coordenadas | null>(null)
  const [activo, setActivo] = useState<PuntoActivo>('origen')
  const [referencia, setReferencia] = useState('')
  const [centro, setCentro] = useState<CentroSalud | null>(null)
  const [destino, setDestino] = useState<Coordenadas | null>(null)
  const [dia, setDia] = useState<Date | null>(null)
  const [hora, setHora] = useState('10:00')
  const [peso, setPeso] = useState('')
  const [acompanantes, setAcompanantes] = useState('0')
  const [observaciones, setObservaciones] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoTelefono, setContactoTelefono] = useState('')

  // El origen pasa a ser de la persona cuando mueve el mapa: desde ahí el GPS ya no lo pisa.
  const origenDeLaPersona = useRef(false)

  // El mapa abre donde está el teléfono, que es de donde se pide la mayoría de las veces. La última posición
  // conocida llega rápido pero puede ser vieja, así que el GPS la reemplaza si llega después y la persona todavía no
  // movió el mapa. Sin ninguna de las dos, el origen queda sin marcar: abrir sobre la ciudad no es elegirla.
  useEffect(() => {
    let vigente = true
    void ultimaUbicacionReciente().then((punto) => {
      if (vigente && punto && !origenDeLaPersona.current) {
        setOrigen((actual) => actual ?? punto)
      }
    })
    void obtenerUbicacionGps().then((punto) => {
      if (vigente && punto && !origenDeLaPersona.current) {
        setOrigen(punto)
      }
    })
    return () => {
      vigente = false
    }
  }, [])

  const pasajero =
    pasajeroId === null
      ? (ciudadano?.nombreCompleto ?? 'Yo')
      : (personas.data?.find((persona) => persona.id === pasajeroId)?.nombreCompleto ?? 'Elegir')

  const textoDestino = centro ? centro.nombre : destino ? 'Punto marcado en el mapa' : 'Elegir'
  const textoCuando = dia ? `${etiquetaDeDia(dia)} · tiene que estar ${hora}` : 'Lo antes posible'

  function enviar() {
    if (!origen) {
      toast.show('Falta el punto de recogida', { message: 'En el mapa, elige "De dónde" y deja el pin ahí.' })
      return
    }
    if (!centro && !destino) {
      toast.show('Falta el destino', { message: 'En el mapa, elige "A dónde" y deja el pin ahí.' })
      return
    }
    if (Boolean(contactoNombre.trim()) !== Boolean(contactoTelefono.trim())) {
      toast.show('Falta un dato del contacto', { message: 'Pon el nombre y el teléfono, o deja los dos vacíos.' })
      return
    }
    pedir.mutate(
      {
        pasajeroId,
        movilidad,
        oxigeno,
        equipo,
        aislamiento,
        pesoAproximado: peso.trim() ? Number(peso) : null,
        acompanantes: Number(acompanantes) || 0,
        observaciones: observaciones.trim() || null,
        origenLatitud: origen.latitud,
        origenLongitud: origen.longitud,
        origenReferencia: referencia.trim() || null,
        contactoNombre: contactoNombre.trim() || null,
        contactoTelefono: contactoTelefono.trim() || null,
        centroSaludDestinoId: centro?.id ?? null,
        destinoLatitud: centro ? null : destino?.latitud,
        destinoLongitud: centro ? null : destino?.longitud,
        horaCita: dia ? horaCitaComoIso(dia, hora) : null,
      },
      {
        // La ventana ya viene calculada en la respuesta: se dice al confirmar, que es cuando la familia se organiza.
        onSuccess: (traslado) => {
          const ventana = ventanaDeRecogida(traslado, { conDia: true })
          toast.show('Traslado pedido', { message: ventana ? `${ventana}.` : 'Revisa aquí el estado.' })
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

          <YStack gap={4}>
            <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
              Pedir traslado
            </H1>
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              Buscamos una unidad cuando llegue la hora de salir. El estado lo ves en Traslados.
            </Paragraph>
          </YStack>

          <MapaDelPedido
            origen={origen}
            destino={destino}
            activo={activo}
            onCambiarActivo={setActivo}
            onMover={(punto) => {
              if (activo === 'origen') {
                origenDeLaPersona.current = true
                setOrigen(punto)
              } else {
                // Mover el pin manda sobre el centro elegido: la persona está diciendo otra cosa.
                setDestino(punto)
                setCentro(null)
              }
            }}
            etiquetaDestino={centro?.nombre ?? null}
          />

          <YStack rounded={14} borderWidth={1} borderColor="$borde" overflow="hidden">
            <Fila etiqueta="Quién viaja" valor={pasajero} onPress={() => setHoja('quien')} />
            <Fila
              etiqueta="Cómo viaja"
              valor={`${TEXTO_MOVILIDAD[movilidad]}${oxigeno ? ' · Oxígeno' : ''}${equipo ? ' · Equipo' : ''}${aislamiento ? ' · Aislamiento' : ''}`}
              onPress={() => setHoja('como')}
            />
            <Fila etiqueta="A dónde" valor={textoDestino} onPress={() => setHoja('destino')} />
            <Fila etiqueta="Cuándo" valor={textoCuando} onPress={() => setHoja('cuando')} ultima />
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
              Es lo que hace que la ambulancia encuentre la puerta.
            </Text>
          </YStack>

          <YStack gap={10}>
            <Text fontSize={13} fontWeight="600" color="$texto">
              Quién recibe a la ambulancia
            </Text>
            <Input size="$4" placeholder="Nombre" value={contactoNombre} onChangeText={setContactoNombre} />
            <Input
              size="$4"
              placeholder="Teléfono"
              keyboardType="phone-pad"
              value={contactoTelefono}
              onChangeText={setContactoTelefono}
            />
            <Text fontSize={12} lineHeight={17} color="$textoSecundario">
              Déjalo vacío si vas a estar tú. Sirve cuando el que pide no es el que abre la puerta.
            </Text>
          </YStack>

          <YStack gap={10}>
            <Text fontSize={13} fontWeight="600" color="$texto">
              Otros datos
            </Text>
            <XStack gap={10}>
              <YStack flex={1} gap={4}>
                <Text fontSize={12} color="$textoSecundario">
                  Peso aproximado (kg)
                </Text>
                <Input size="$4" placeholder="70" keyboardType="number-pad" value={peso} onChangeText={setPeso} />
              </YStack>
              <YStack flex={1} gap={4}>
                <Text fontSize={12} color="$textoSecundario">
                  Acompañantes
                </Text>
                <Input
                  size="$4"
                  placeholder="0"
                  keyboardType="number-pad"
                  value={acompanantes}
                  onChangeText={setAcompanantes}
                />
              </YStack>
            </XStack>
            <Input
              size="$4"
              placeholder="Algo más que la tripulación deba saber"
              value={observaciones}
              onChangeText={setObservaciones}
            />
            <Text fontSize={12} lineHeight={17} color="$textoSecundario">
              El peso define si hace falta camilla reforzada y cuánta gente para cargar.
            </Text>
          </YStack>

          <BotonPrincipal disabled={pedir.isPending} opacity={pedir.isPending ? 0.6 : 1} onPress={enviar}>
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Pedir traslado
            </Button.Text>
          </BotonPrincipal>
        </YStack>
      </ScrollView>

      <SelectorDeCuando
        abierto={hoja === 'cuando'}
        dia={dia}
        hora={hora}
        onCambiar={(nuevoDia, nuevaHora) => {
          setDia(nuevoDia)
          setHora(nuevaHora)
        }}
        onCerrar={() => setHoja(null)}
      />

      <HojaElegir
        abierta={hoja === 'quien' || hoja === 'como' || hoja === 'destino'}
        onCerrar={() => setHoja(null)}
      >
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
              Para agregar a alguien, entra a tu perfil. Queda guardado para los próximos pedidos.
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
            <Opcion
              titulo="Necesita aislamiento"
              detalle="La tripulación tiene que saberlo antes de llegar"
              elegida={aislamiento}
              onPress={() => setAislamiento(!aislamiento)}
            />
            <Text fontSize={12} lineHeight={17} color="$textoSecundario">
              Con esto elegimos la unidad que corresponde. Es de este viaje: si cambia, en el próximo lo vuelves a
              elegir.
            </Text>
          </>
        ) : null}

        {hoja === 'destino' ? (
          <>
            <Titulo>¿A dónde lo llevamos?</Titulo>
            <Text fontSize={13} lineHeight={18} color="$textoSecundario">
              Si va a una casa o a otro lugar, márcalo directo en el mapa de arriba.
            </Text>
            <AtajoDeCentros
              centros={centros.data ?? []}
              elegido={centro?.id ?? null}
              onElegir={(opcion) => {
                setCentro(opcion)
                setDestino({ latitud: opcion.latitud, longitud: opcion.longitud })
                setActivo('destino')
                setHoja(null)
              }}
            />
          </>
        ) : null}
      </HojaElegir>
    </>
  )
}

function etiquetaDeDia(dia: Date) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diferencia = Math.round((dia.getTime() - hoy.getTime()) / 86_400_000)
  if (diferencia === 0) {
    return 'Hoy'
  }
  if (diferencia === 1) {
    return 'Mañana'
  }
  return dia.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })
}

/** El backend espera un instante: se arma el día elegido con la hora elegida, en la hora del teléfono. */
function horaCitaComoIso(dia: Date, hora: string) {
  const [horas, minutos] = hora.split(':').map(Number)
  const fecha = new Date(dia)
  fecha.setHours(horas, minutos, 0, 0)
  return fecha.toISOString()
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
    <Sheet
      modal
      open={abierta}
      onOpenChange={(valor: boolean) => !valor && onCerrar()}
      snapPointsMode="fit"
      dismissOnSnapToBottom
    >
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

/**
 * Los centros de salud son un atajo, no el camino: un traslado va tan seguido a una clínica como a una casa.
 * Por eso el mapa va primero y esto abajo, y si no hay ninguno cargado la pantalla lo dice en vez de quedar vacía.
 */
function AtajoDeCentros({
  centros,
  elegido,
  onElegir,
}: {
  centros: CentroSalud[]
  elegido: number | null
  onElegir: (centro: CentroSalud) => void
}) {
  if (centros.length === 0) {
    return (
      <Text fontSize={12} lineHeight={17} color="$textoSecundario">
        Todavía no hay centros de salud cargados, así que márcalo en el mapa.
      </Text>
    )
  }
  return (
    <>
      <Text fontSize={12} fontWeight="600" color="$textoTenue" letterSpacing={0.5}>
        O UN CENTRO DE SALUD
      </Text>
      {centros.map((opcion) => (
        <Opcion
          key={opcion.id}
          titulo={opcion.nombre}
          detalle={opcion.direccion ?? ''}
          elegida={elegido === opcion.id}
          onPress={() => onElegir(opcion)}
        />
      ))}
    </>
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
