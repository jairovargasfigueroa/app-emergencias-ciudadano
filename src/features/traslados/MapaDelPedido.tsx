import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useEffect, useRef } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import MapView, { Marker, type Region } from 'react-native-maps'
import { Text, XStack, YStack, useTheme } from 'tamagui'

import type { Coordenadas } from '@/features/alerta/ubicacion'

/** Ciudad donde opera el servicio, configurada en .env.local. Sin ella, el mapa abre sobre Bolivia. */
const CIUDAD = coordenadasDeEntorno(process.env.EXPO_PUBLIC_MAPA_LATITUD, process.env.EXPO_PUBLIC_MAPA_LONGITUD)

const DELTA_CALLE = 0.005
const DELTA_CIUDAD = 0.08
const REGION_BOLIVIA: Region = { latitude: -16.3, longitude: -63.6, latitudeDelta: 14, longitudeDelta: 14 }
const ALTO_MAPA = 220
const ALTO_PIN = 44

function coordenadasDeEntorno(latitud: string | undefined, longitud: string | undefined): Coordenadas | null {
  if (!latitud?.trim() || !longitud?.trim()) {
    return null
  }
  const lat = Number(latitud)
  const lon = Number(longitud)
  const validas = Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0)
  return validas ? { latitud: lat, longitud: lon } : null
}

function regionAlrededorDe({ latitud, longitud }: Coordenadas, delta: number): Region {
  return { latitude: latitud, longitude: longitud, latitudeDelta: delta, longitudeDelta: delta }
}

export type PuntoActivo = 'origen' | 'destino'

type Props = {
  origen: Coordenadas | null
  destino: Coordenadas | null
  /** Cuál de los dos puntos mueve el mapa ahora mismo. */
  activo: PuntoActivo
  onCambiarActivo: (punto: PuntoActivo) => void
  onMover: (punto: Coordenadas) => void
  /** Etiqueta del destino cuando salió de un centro de salud, para que el mapa no lo contradiga. */
  etiquetaDestino: string | null
}

/**
 * El mapa va fijo en la pantalla y no en una hoja: dentro de una hoja el gesto de arrastrar pelea con el de mover
 * el mapa y termina moviéndose lo que no era. Acá el mapa se queda y el pin del centro mueve el punto elegido,
 * que es el mismo gesto de la pantalla del pin de la alerta.
 */
export function MapaDelPedido({ origen, destino, activo, onCambiarActivo, onMover, etiquetaDestino }: Props) {
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const tema = useTheme()
  const mapa = useRef<MapView>(null)
  const puntoActivo = activo === 'origen' ? origen : destino
  const puntoQuieto = activo === 'origen' ? destino : origen

  const regionInicial = origen
    ? regionAlrededorDe(origen, DELTA_CALLE)
    : CIUDAD
      ? regionAlrededorDe(CIUDAD, DELTA_CIUDAD)
      : REGION_BOLIVIA

  // El mapa abre donde esté el teléfono. Como el GPS llega después del primer dibujado, se acerca cuando llega.
  const yaSeAcerco = useRef(false)
  useEffect(() => {
    if (!yaSeAcerco.current && origen) {
      yaSeAcerco.current = true
      mapa.current?.animateToRegion(regionAlrededorDe(origen, DELTA_CALLE), 400)
    }
  }, [origen])

  // Al cambiar de punto, el mapa va hacia el que ahora se mueve, si ya tiene uno puesto.
  useEffect(() => {
    if (puntoActivo) {
      mapa.current?.animateToRegion(regionAlrededorDe(puntoActivo, DELTA_CALLE), 300)
    }
    // Solo cuando cambia cuál se está moviendo: si no, el mapa se movería solo con cada arrastre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo])

  return (
    <YStack gap={8}>
      <XStack gap={8}>
        <Pestana texto="De dónde" elegida={activo === 'origen'} onPress={() => onCambiarActivo('origen')} />
        <Pestana texto="A dónde" elegida={activo === 'destino'} onPress={() => onCambiarActivo('destino')} />
      </XStack>

      <YStack height={ALTO_MAPA} rounded={14} overflow="hidden" borderWidth={1} borderColor="$borde">
        <MapView
          ref={mapa}
          style={StyleSheet.absoluteFill}
          initialRegion={regionInicial}
          userInterfaceStyle={esquema}
          showsUserLocation
          showsMyLocationButton
          onRegionChangeComplete={(region) => onMover({ latitud: region.latitude, longitud: region.longitude })}
        >
          {puntoQuieto ? (
            <Marker
              coordinate={{ latitude: puntoQuieto.latitud, longitude: puntoQuieto.longitud }}
              title={activo === 'origen' ? 'Destino' : 'Recogida'}
              pinColor={activo === 'origen' ? '#16A34A' : '#D92D20'}
            />
          ) : null}
        </MapView>

        {/* El pin queda quieto sobre el centro: se desplaza su alto para que la punta marque el punto exacto. */}
        <YStack position="absolute" t="50%" l="50%" ml={-14} mt={-ALTO_PIN} pointerEvents="none">
          <MaterialIcons name="place" size={ALTO_PIN} color={tema.primario?.val ?? '#D92D20'} />
        </YStack>
      </YStack>

      <Text fontSize={12} lineHeight={17} color="$textoSecundario">
        {activo === 'origen'
          ? 'Mové el mapa hasta dejar el pin donde lo recogemos.'
          : etiquetaDestino
            ? `Destino: ${etiquetaDestino}. Mové el mapa si querés otro lugar.`
            : 'Mové el mapa hasta dejar el pin donde lo llevamos.'}
      </Text>
    </YStack>
  )
}

function Pestana({ texto, elegida, onPress }: { texto: string; elegida: boolean; onPress: () => void }) {
  return (
    <YStack
      px={14}
      py={8}
      rounded={999}
      borderWidth={1}
      borderColor={elegida ? '$primario' : '$borde'}
      bg={elegida ? '$primarioTinte' : 'transparent'}
      pressStyle={{ bg: '$fondo' }}
      onPress={onPress}
    >
      <Text fontSize={14} fontWeight={elegida ? '600' : '500'} color="$texto">
        {texto}
      </Text>
    </YStack>
  )
}
