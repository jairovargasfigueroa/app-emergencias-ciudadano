import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useEffect, useRef } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import MapView, { Marker, type Details, type Region } from 'react-native-maps'
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

function mismoPunto(a: Coordenadas, b: Coordenadas) {
  return a.latitud === b.latitud && a.longitud === b.longitud
}

/**
 * Si el centro se corrió de verdad, y no solo por redondeo: acercar o alejar con los botones del mapa deja el centro
 * donde estaba, y eso no es elegir un lugar. El umbral es una centésima de lo que se ve, unos metros a nivel de calle.
 */
function seCorrio(antes: Coordenadas, region: Region) {
  return (
    Math.abs(region.latitude - antes.latitud) > region.latitudeDelta / 100 ||
    Math.abs(region.longitude - antes.longitud) > region.longitudeDelta / 100
  )
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
 *
 * Solo cuenta como elección lo que la persona mueve con el dedo. La cámara también se mueve sola —al abrirse,
 * cuando llega el GPS, al elegir un centro de salud— y si eso contara, el centro elegido se borraría y el origen
 * quedaría en el medio de la ciudad sin que nadie lo haya marcado.
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

  // Si la persona tocó el mapa desde la última vez que se detuvo. Google Maps (Android) ya dice con `isGesture` si
  // el movimiento fue suyo, pero Apple Maps lo manda siempre en falso: ahí esta es la señal. Cubre también el botón
  // de "mi ubicación", que está dentro del mapa y mueve la cámara porque la persona lo pidió.
  const tocoElMapa = useRef(false)
  // Dónde se detuvo la cámara la última vez, la moviera quien la moviera.
  const camara = useRef<Coordenadas | null>(null)
  // Lo que el pin marca ahora. Si el punto activo cambia a otro lugar, no fue el dedo: lo cambió la app —el GPS que
  // llegó tarde, un centro de salud, la otra pestaña— y la cámara va hasta él para que el pin lo marque.
  const marcado = useRef<Coordenadas | null>(origen)

  useEffect(() => {
    if (!puntoActivo || (marcado.current && mismoPunto(puntoActivo, marcado.current))) {
      return
    }
    marcado.current = puntoActivo
    // Mover la cámara por código no es elegir: un toque de antes que no movió nada no tiene que contar ahora.
    tocoElMapa.current = false
    mapa.current?.animateToRegion(regionAlrededorDe(puntoActivo, DELTA_CALLE), 300)
  }, [puntoActivo])

  function alDetenerse(region: Region, detalles: Details) {
    const antes = camara.current
    camara.current = { latitud: region.latitude, longitud: region.longitude }
    const fueLaPersona = detalles.isGesture === true || tocoElMapa.current
    tocoElMapa.current = false
    if (!fueLaPersona || (antes && !seCorrio(antes, region))) {
      return
    }
    marcado.current = camara.current
    onMover(camara.current)
  }

  function marcarToque() {
    tocoElMapa.current = true
  }

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
          // Tocar el punto del otro extremo no mueve la cámara hasta él: sería un movimiento que nadie eligió.
          moveOnMarkerPress={false}
          onTouchStart={marcarToque}
          onTouchMove={marcarToque}
          onRegionChangeComplete={alDetenerse}
        >
          {puntoQuieto ? (
            <Marker
              coordinate={{ latitude: puntoQuieto.latitud, longitude: puntoQuieto.longitud }}
              title={activo === 'origen' ? 'Destino' : 'Recogida'}
              pinColor={activo === 'origen' ? '#16A34A' : '#D92D20'}
            />
          ) : null}
        </MapView>

        {/* El pin queda quieto sobre el centro: se desplaza su alto para que la punta marque el punto exacto. Gris
            mientras ese punto no esté marcado, como el pin de la alerta: la cámara puede estar ahí sin que nadie
            haya elegido nada. */}
        <YStack position="absolute" t="50%" l="50%" ml={-14} mt={-ALTO_PIN} pointerEvents="none">
          <MaterialIcons
            name="place"
            size={ALTO_PIN}
            color={puntoActivo ? (tema.primario?.val ?? '#D92D20') : tema.textoSecundario?.val}
          />
        </YStack>
      </YStack>

      <Text fontSize={12} lineHeight={17} color="$textoSecundario">
        {activo === 'origen'
          ? 'Mueve el mapa hasta dejar el pin donde lo recogemos.'
          : etiquetaDestino
            ? `Destino: ${etiquetaDestino}. Mueve el mapa si quieres otro lugar.`
            : 'Mueve el mapa hasta dejar el pin donde lo llevamos.'}
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
