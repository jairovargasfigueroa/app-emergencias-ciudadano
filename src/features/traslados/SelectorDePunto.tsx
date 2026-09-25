import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRef, useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import MapView, { type Region } from 'react-native-maps'
import { Button, Sheet, Text, XStack, YStack, useTheme } from 'tamagui'

import type { Coordenadas } from '@/features/alerta/ubicacion'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

/** Ciudad donde opera el servicio, configurada en .env.local. Sin ella, el mapa abre sobre Bolivia. */
const CIUDAD = coordenadasDeEntorno(process.env.EXPO_PUBLIC_MAPA_LATITUD, process.env.EXPO_PUBLIC_MAPA_LONGITUD)

const DELTA_CALLE = 0.005
const DELTA_CIUDAD = 0.08
const REGION_BOLIVIA: Region = { latitude: -16.3, longitude: -63.6, latitudeDelta: 14, longitudeDelta: 14 }
const ALTO_PIN = 48

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

type Props = {
  abierto: boolean
  titulo: string
  /** Desde dónde abre el mapa: el punto ya elegido, o la ubicación del teléfono si todavía no hay ninguno. */
  inicial: Coordenadas | null
  onElegir: (punto: Coordenadas) => void
  onCerrar: () => void
}

/**
 * El mapa se mueve y el pin se queda quieto en el centro: es más fácil que arrastrar un marcador con el dedo
 * tapando justo lo que se quiere ver. Es el mismo gesto que ya usa la pantalla del pin de la alerta.
 */
export function SelectorDePunto({ abierto, titulo, inicial, onElegir, onCerrar }: Props) {
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const tema = useTheme()
  const mapa = useRef<MapView>(null)
  const [centro, setCentro] = useState<Coordenadas | null>(inicial)

  const regionInicial = inicial
    ? regionAlrededorDe(inicial, DELTA_CALLE)
    : CIUDAD
      ? regionAlrededorDe(CIUDAD, DELTA_CIUDAD)
      : REGION_BOLIVIA

  return (
    <Sheet modal open={abierto} onOpenChange={(valor: boolean) => !valor && onCerrar()} snapPoints={[92]}>
      <Sheet.Overlay bg="$velo" />
      <Sheet.Frame bg="$superficie" borderTopLeftRadius={20} borderTopRightRadius={20} overflow="hidden">
        <XStack items="center" justify="space-between" px={16} py={12}>
          <Text fontSize={17} fontWeight="600" color="$texto">
            {titulo}
          </Text>
          <Button size="$3" chromeless onPress={onCerrar}>
            <Button.Text color="$textoSecundario" fontSize={15}>
              Cancelar
            </Button.Text>
          </Button>
        </XStack>

        <YStack flex={1}>
          <MapView
            ref={mapa}
            style={StyleSheet.absoluteFill}
            initialRegion={regionInicial}
            userInterfaceStyle={esquema}
            showsUserLocation
            onRegionChangeComplete={(region) => setCentro({ latitud: region.latitude, longitud: region.longitude })}
          />
          {/* El pin va sobre el centro exacto del mapa: se desplaza media altura para que la punta quede ahí. */}
          <YStack
            position="absolute"
            t="50%"
            l="50%"
            ml={-16}
            mt={-ALTO_PIN}
            pointerEvents="none"
            items="center"
          >
            <MaterialIcons name="place" size={ALTO_PIN} color={tema.primario?.val ?? '#D92D20'} />
          </YStack>
        </YStack>

        <YStack p={16} gap={10} bg="$superficie">
          <Text fontSize={13} lineHeight={18} color="$textoSecundario">
            Mové el mapa hasta dejar el pin en el lugar exacto.
          </Text>
          <BotonPrincipal
            disabled={centro === null}
            opacity={centro === null ? 0.5 : 1}
            onPress={() => centro && onElegir(centro)}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Confirmar este punto
            </Button.Text>
          </BotonPrincipal>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
