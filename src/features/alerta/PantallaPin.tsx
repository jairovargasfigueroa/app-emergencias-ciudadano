import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import MapView, { type Region } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Paragraph, Spinner, Text, XStack, YStack, useTheme, useToastController } from 'tamagui'

import type { SeguimientoGuardado } from '@/features/seguimiento/almacen'
import { abrirSeguimiento } from '@/features/seguimiento/navegacion'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { AvisoAlertaNoEnviada } from './AvisoAlertaNoEnviada'
import { obtenerUbicacionGps, ultimaUbicacionReciente, type Coordenadas } from './ubicacion'
import { useEnviarAlerta } from './useEnviarAlerta'

/** Ciudad donde opera el servicio, o `null` si no está configurada o no es válida. Se configura en .env.local. */
const CIUDAD = coordenadasDeEntorno(process.env.EXPO_PUBLIC_MAPA_LATITUD, process.env.EXPO_PUBLIC_MAPA_LONGITUD)

/** Acercamiento del mapa: a nivel de calle si hay una posición reciente; si no, la ciudad entera. */
const DELTA_CALLE = 0.005
const DELTA_CIUDAD = 0.08

/** Sin ciudad configurada, Bolivia entera: el mapa nunca arranca en (0, 0). */
const REGION_BOLIVIA: Region = { latitude: -16.3, longitude: -63.6, latitudeDelta: 14, longitudeDelta: 14 }

const ALTO_PIN = 52

function coordenadasDeEntorno(latitud: string | undefined, longitud: string | undefined): Coordenadas | null {
  if (!latitud?.trim() || !longitud?.trim()) {
    return null
  }
  const lat = Number(latitud)
  const lon = Number(longitud)
  // Fuera de rango también descarta lo que no es número; (0, 0) es un valor sin configurar, no una ciudad.
  const validas = Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0)
  return validas ? { latitud: lat, longitud: lon } : null
}

function regionAlrededorDe({ latitud, longitud }: Coordenadas, delta: number): Region {
  return { latitude: latitud, longitude: longitud, latitudeDelta: delta, longitudeDelta: delta }
}

function irAlSeguimiento(seguimiento: SeguimientoGuardado) {
  abrirSeguimiento(seguimiento, { reemplazar: true })
}

/**
 * PB-02 R2 y CA-02: sin GPS, el ciudadano mueve el mapa hasta dejar el pin donde está y la alerta sale con origen
 * MANUAL. Nunca se rechaza por falta de GPS. Aquí basta un toque: ya hubo intención y se perdieron varios segundos.
 * Tampoco se envía un punto que la persona no puso: sin una posición reciente del teléfono, el pin espera gris hasta
 * que mueva el mapa.
 */
export function PantallaPin() {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const tema = useTheme()
  const toast = useToastController()
  const { enviar, empezarIntento, reintentar, enviando, esperandoConexion, rechazada } =
    useEnviarAlerta(irAlSeguimiento)

  const [regionInicial, setRegionInicial] = useState<Region | null>(null)
  const [centro, setCentro] = useState<Coordenadas | null>(null)
  // El punto es de la persona: arrancó en su posición reciente o movió el mapa con el dedo.
  const [ubicado, setUbicado] = useState(false)
  const [buscandoGps, setBuscandoGps] = useState(false)
  const arrastroElMapa = useRef(false)

  useEffect(() => {
    let vigente = true
    ultimaUbicacionReciente().then((reciente) => {
      if (!vigente) {
        return
      }
      if (reciente) {
        setRegionInicial(regionAlrededorDe(reciente, DELTA_CALLE))
        setCentro(reciente)
        setUbicado(true)
      } else {
        // Sin posición reciente o sin permiso no hay punto que enviar: el mapa muestra la zona y espera a la persona.
        setRegionInicial(CIUDAD ? regionAlrededorDe(CIUDAD, DELTA_CIUDAD) : REGION_BOLIVIA)
      }
    })
    return () => {
      vigente = false
    }
  }, [])

  /**
   * Cuenta solo el movimiento hecho por la persona, no el encuadre inicial del mapa. Google Maps (Android) lo informa
   * con `isGesture`; Apple Maps no, así que ahí vale que haya arrastrado el dedo sobre el mapa antes de que se detenga.
   */
  function alDetenerseElMapa(region: Region, detalles: { isGesture?: boolean }) {
    setCentro({ latitud: region.latitude, longitud: region.longitude })
    if (detalles.isGesture || arrastroElMapa.current) {
      setUbicado(true)
    }
  }

  async function reintentarGps() {
    empezarIntento()
    setBuscandoGps(true)
    const coordenadas = await obtenerUbicacionGps()
    setBuscandoGps(false)
    if (coordenadas) {
      enviar(coordenadas, 'GPS')
    } else {
      toast.show('Seguimos sin tu ubicación', { message: 'Mueve el mapa hasta dejar el pin donde estás.' })
    }
  }

  const ocupado = enviando || buscandoGps
  const listoParaEnviar = ubicado && centro !== null
  // Mientras sale una alerta (también la del GPS) el botón muestra el envío; sin punto de la persona queda apagado.
  const botonActivo = listoParaEnviar || enviando

  return (
    <YStack flex={1} bg="$fondo">
      {regionInicial ? (
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={regionInicial}
          onTouchMove={() => {
            arrastroElMapa.current = true
          }}
          onRegionChangeComplete={alDetenerseElMapa}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          userInterfaceStyle={esquema}
        />
      ) : (
        <YStack flex={1} items="center" justify="center">
          <Spinner size="large" color="$primario" />
        </YStack>
      )}

      {/* El pin queda fijo en el centro del mapa: la punta marca el punto que se envía. Gris hasta estar ubicado. */}
      <YStack position="absolute" t={0} b={0} l={0} r={0} items="center" justify="center" pointerEvents="none">
        <YStack height={ALTO_PIN * 2} items="center">
          <MaterialCommunityIcons
            name="map-marker"
            size={ALTO_PIN}
            color={ubicado ? tema.primario?.val : tema.textoSecundario?.val}
          />
        </YStack>
      </YStack>

      <YStack
        position="absolute"
        t={margenes.top + 12}
        l={16}
        r={16}
        gap={12}
        p={16}
        rounded={16}
        bg="$superficie"
        shadowColor="#000000"
        shadowOpacity={0.12}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: 8 }}
        elevation={6}
      >
        <XStack gap={12}>
          <YStack width={40} height={40} shrink={0} rounded={999} bg="$primarioTinte" items="center" justify="center">
            <Feather name="map-pin" size={20} color={tema.primario?.val} />
          </YStack>
          <YStack flex={1} gap={4}>
            <Text color="$texto" fontSize={18} lineHeight={24} fontWeight="600">
              Marca dónde estás
            </Text>
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              Mueve el mapa hasta dejar el pin sobre tu posición.
            </Paragraph>
          </YStack>
        </XStack>
        {/* Lo más importante de esta pantalla: todavía no salió nada. */}
        <XStack items="center" gap={8} px={12} py={10} rounded={12} bg="$enAtencionTinte">
          <Feather name="alert-circle" size={18} color={tema.enAtencionTexto?.val} />
          <Text color="$enAtencionTexto" fontSize={15} lineHeight={20} fontWeight="600" shrink={1}>
            Tu alerta todavía no se ha enviado
          </Text>
        </XStack>
      </YStack>

      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        gap={10}
        px={16}
        pt={20}
        pb={margenes.bottom + 20}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
        shadowColor="#000000"
        shadowOpacity={0.1}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: -8 }}
        elevation={12}
      >
        {rechazada ? <AvisoAlertaNoEnviada reintentando={enviando} onReintentar={reintentar} /> : null}
        {esperandoConexion ? (
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center">
            Sin conexión. La alerta se enviará en cuanto vuelva la señal.
          </Paragraph>
        ) : null}
        <BotonPrincipal
          disabled={!listoParaEnviar || ocupado}
          bg={botonActivo ? '$primario' : '$borde'}
          opacity={botonActivo && ocupado ? 0.7 : 1}
          icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
          aria-label={listoParaEnviar ? 'Enviar la alerta con este punto' : 'Mueve el mapa hasta donde estás'}
          onPress={() => ubicado && centro && enviar(centro, 'MANUAL')}
        >
          <Button.Text color={botonActivo ? '$primarioTexto' : '$textoSecundario'} fontSize={17} fontWeight="600">
            {enviando ? 'Enviando…' : listoParaEnviar ? 'Enviar alerta aquí' : 'Mueve el mapa hasta donde estás'}
          </Button.Text>
        </BotonPrincipal>
        {listoParaEnviar ? (
          <Paragraph color="$textoTenue" fontSize={13} lineHeight={18} text="center">
            Un toque y la ayuda sale con este punto.
          </Paragraph>
        ) : null}
        <Button
          height={48}
          rounded={14}
          chromeless
          disabled={ocupado}
          icon={buscandoGps ? <Spinner color="$textoSecundario" /> : undefined}
          onPress={reintentarGps}
        >
          <Button.Text color="$texto" fontSize={15} fontWeight="500">
            Intentar de nuevo con GPS
          </Button.Text>
        </Button>
      </YStack>
    </YStack>
  )
}
