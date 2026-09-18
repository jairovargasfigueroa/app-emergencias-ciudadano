import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import MapView, { Marker, Polyline, type Region } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Input, Text, XStack, YStack, useTheme } from 'tamagui'

import type { Coordenadas } from '@/features/alerta/ubicacion'
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { textoDistancia } from './geo'
import { guardarRecorrido, largoEnMetros, MAXIMO_PUNTOS } from './recorridos'

/** Ciudad configurada en .env.local; si falta, se ve Bolivia entera, igual que en la pantalla del pin. */
const REGION_INICIAL: Region = regionDeEntorno()

/**
 * Marca en el mapa desde dónde quieres que la app crea que estás. Un toque deja un punto fijo, que es lo normal para
 * pedir ayuda; varios toques arman un recorrido por el que la posición avanza sola.
 */
export function PantallaRecorrido() {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const tema = useTheme()
  const [puntos, setPuntos] = useState<Coordenadas[]>([])
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)

  const sePuedeGuardar = puntos.length >= 1 && nombre.trim().length > 0 && !guardando
  const lleno = puntos.length >= MAXIMO_PUNTOS

  async function guardar() {
    setGuardando(true)
    try {
      await guardarRecorrido(nombre, puntos)
      router.back()
    } catch {
      setGuardando(false)
    }
  }

  return (
    <YStack flex={1} bg="$fondo">
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={REGION_INICIAL}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        userInterfaceStyle={esquema}
        onPress={(evento) => {
          const { latitude, longitude } = evento.nativeEvent.coordinate
          setPuntos((anteriores) =>
            anteriores.length >= MAXIMO_PUNTOS
              ? anteriores
              : [...anteriores, { latitud: latitude, longitud: longitude }],
          )
        }}
      >
        {puntos.length > 1 ? (
          <Polyline
            coordinates={puntos.map((punto) => ({ latitude: punto.latitud, longitude: punto.longitud }))}
            strokeColor={tema.primario?.val}
            strokeWidth={4}
          />
        ) : null}
        {puntos.map((punto, indice) => (
          <Marker
            key={`${punto.latitud},${punto.longitud},${indice}`}
            coordinate={{ latitude: punto.latitud, longitude: punto.longitud }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <YStack
              width={indice === 0 || indice === puntos.length - 1 ? 16 : 10}
              height={indice === 0 || indice === puntos.length - 1 ? 16 : 10}
              rounded={999}
              borderWidth={2}
              borderColor="#FFFFFF"
              bg="$primario"
            />
          </Marker>
        ))}
      </MapView>

      <XStack position="absolute" t={margenes.top + 12} l={16} r={16} items="center" gap={12}>
        <Button
          width={48}
          height={48}
          p={0}
          rounded={999}
          bg="$superficie"
          borderColor="$borde"
          aria-label="Cancelar"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={tema.texto?.val} />
        </Button>
        <XStack items="center" px={14} height={48} rounded={999} bg="$superficie" borderWidth={1} borderColor="$borde">
          <Text color="$texto" fontSize={14} fontWeight="500">
            {puntos.length === 0
              ? 'Toca dónde estás'
              : puntos.length === 1
                ? 'Punto fijo · toca más para un recorrido'
                : lleno
                  ? `${puntos.length} puntos, ya no entran más`
                  : `${puntos.length} puntos · ${textoDistancia(largoEnMetros(puntos))}`}
          </Text>
        </XStack>
      </XStack>

      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        gap={10}
        px={16}
        pt={14}
        pb={margenes.bottom + 16}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
      >
        <XStack gap={8}>
          <Input
            flex={1}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre, por ejemplo: mi casa"
            placeholderTextColor="$textoTenue"
            maxLength={40}
            height={48}
            rounded={12}
            fontSize={15}
            bg="$fondo"
            borderColor="$borde"
            returnKeyType="done"
          />
          <Button
            width={48}
            height={48}
            p={0}
            rounded={12}
            bg="$fondo"
            borderColor="$borde"
            disabled={puntos.length === 0}
            opacity={puntos.length === 0 ? 0.5 : 1}
            aria-label="Deshacer el último punto"
            onPress={() => setPuntos((anteriores) => anteriores.slice(0, -1))}
          >
            <Feather name="corner-up-left" size={18} color={tema.texto?.val} />
          </Button>
        </XStack>

        <BotonPrincipal disabled={!sePuedeGuardar} opacity={sePuedeGuardar ? 1 : 0.5} onPress={() => void guardar()}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Guardar
          </Button.Text>
        </BotonPrincipal>
      </YStack>
    </YStack>
  )
}

function regionDeEntorno(): Region {
  const latitud = Number(process.env.EXPO_PUBLIC_MAPA_LATITUD)
  const longitud = Number(process.env.EXPO_PUBLIC_MAPA_LONGITUD)
  const configurada = Number.isFinite(latitud) && Number.isFinite(longitud) && !(latitud === 0 && longitud === 0)
  return configurada
    ? { latitude: latitud, longitude: longitud, latitudeDelta: 0.08, longitudeDelta: 0.08 }
    : { latitude: -16.3, longitude: -63.6, latitudeDelta: 14, longitudeDelta: 14 }
}
