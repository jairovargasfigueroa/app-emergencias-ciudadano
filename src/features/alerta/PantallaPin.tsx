import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import MapView, { type Region } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Paragraph, Spinner, Text, XStack, YStack, useTheme, useToastController } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { AlertaCreada } from './api'
import { obtenerUbicacionGps, ultimaUbicacionConocida, type Coordenadas } from './ubicacion'
import { useEnviarAlerta } from './useEnviarAlerta'

/** Centro del mapa si el teléfono no conoce ninguna posición. Se configura en .env.local. */
const CENTRO_POR_DEFECTO: Coordenadas = {
  latitud: numeroDeEntorno(process.env.EXPO_PUBLIC_MAPA_LATITUD),
  longitud: numeroDeEntorno(process.env.EXPO_PUBLIC_MAPA_LONGITUD),
}

/** Acercamiento del mapa: a nivel de calle si hay una posición conocida; si no, la ciudad entera. */
const DELTA_CALLE = 0.005
const DELTA_CIUDAD = 0.08

const ALTO_PIN = 52

function numeroDeEntorno(valor: string | undefined) {
  const numero = Number(valor)
  return valor && Number.isFinite(numero) ? numero : 0
}

function regionAlrededorDe({ latitud, longitud }: Coordenadas, delta: number): Region {
  return { latitude: latitud, longitude: longitud, latitudeDelta: delta, longitudeDelta: delta }
}

function irAlSeguimiento(alerta: AlertaCreada) {
  router.replace({ pathname: '/seguimiento/[incidenteId]', params: { incidenteId: String(alerta.incidenteId) } })
}

/**
 * PB-02 R2 y CA-02: sin GPS, el ciudadano mueve el mapa hasta dejar el pin donde está y la alerta sale con origen
 * MANUAL. Nunca se rechaza por falta de GPS.
 */
export function PantallaPin() {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const tema = useTheme()
  const toast = useToastController()
  const { enviar, enviando, esperandoConexion } = useEnviarAlerta(irAlSeguimiento)

  const [regionInicial, setRegionInicial] = useState<Region | null>(null)
  const [centro, setCentro] = useState<Coordenadas | null>(null)
  const [buscandoGps, setBuscandoGps] = useState(false)

  useEffect(() => {
    let vigente = true
    ultimaUbicacionConocida().then((ultima) => {
      if (!vigente) {
        return
      }
      const inicio = ultima ?? CENTRO_POR_DEFECTO
      setRegionInicial(regionAlrededorDe(inicio, ultima ? DELTA_CALLE : DELTA_CIUDAD))
      setCentro(inicio)
    })
    return () => {
      vigente = false
    }
  }, [])

  async function reintentarGps() {
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

  return (
    <YStack flex={1} bg="$fondo">
      {regionInicial ? (
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={regionInicial}
          onRegionChangeComplete={(region) => setCentro({ latitud: region.latitude, longitud: region.longitude })}
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

      {/* El pin queda fijo en el centro del mapa: la punta marca el punto que se envía. */}
      <YStack position="absolute" t={0} b={0} l={0} r={0} items="center" justify="center" pointerEvents="none">
        <YStack height={ALTO_PIN * 2} items="center">
          <MaterialCommunityIcons name="map-marker" size={ALTO_PIN} color={tema.primario?.val} />
        </YStack>
      </YStack>

      <XStack
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
        <YStack width={40} height={40} shrink={0} rounded={999} bg="$enAtencionTinte" items="center" justify="center">
          <Feather name="alert-triangle" size={20} color={tema.enAtencionTexto?.val} />
        </YStack>
        <YStack flex={1} gap={4}>
          <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
            No pudimos obtener tu ubicación
          </Text>
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            Mueve el mapa hasta dejar el pin donde estás.
          </Paragraph>
        </YStack>
      </XStack>

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
        {esperandoConexion ? (
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center">
            Sin conexión. La alerta se enviará en cuanto vuelva la señal.
          </Paragraph>
        ) : null}
        <BotonPrincipal
          disabled={!centro || ocupado}
          opacity={!centro || ocupado ? 0.7 : 1}
          icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
          onPress={() => centro && enviar(centro, 'MANUAL')}
        >
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Enviar alerta aquí
          </Button.Text>
        </BotonPrincipal>
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
