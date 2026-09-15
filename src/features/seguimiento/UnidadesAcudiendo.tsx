import { useEffect, useRef } from 'react'
import { ScrollView, useColorScheme } from 'react-native'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H1, Text, YStack } from 'tamagui'

import type { Coordenadas } from '@/features/alerta/ubicacion'
import { useAhora } from '@/shared/reloj/useAhora'

import type { EstadoAtencion, UnidadSeguimiento } from './api'
import { MarcadorCiudadano, MarcadorUnidad } from './MarcadorUnidad'
import { TarjetaUnidad } from './TarjetaUnidad'
import { posicionDesactualizada } from './vista'

type Props = {
  unidades: UnidadSeguimiento[]
  etapa: EstadoAtencion
  ubicacionCiudadano: Coordenadas | null
}

function encabezado(etapa: EstadoAtencion, unidades: UnidadSeguimiento[]) {
  if (etapa === 'PACIENTE_RECOGIDO') {
    return { titulo: 'Paciente recogido', detalle: 'Van camino al centro de salud.' }
  }
  if (etapa === 'EN_EL_LUGAR') {
    const llego = unidades.find((unidad) => unidad.estado === 'EN_EL_LUGAR')
    return { titulo: 'En el lugar', detalle: `La unidad ${llego?.placa ?? ''} llegó a tu ubicación.` }
  }
  return {
    titulo: 'La ayuda está en camino',
    detalle: unidades.length === 1 ? '1 unidad acude a tu alerta' : `${unidades.length} unidades acuden a tu alerta`,
  }
}

/** PB-06 CA-02 a CA-04: todas las unidades que acuden, con su estado y su posición en vivo. */
export function UnidadesAcudiendo({ unidades, etapa, ubicacionCiudadano }: Props) {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const mapa = useRef<MapView>(null)
  const ahora = useAhora()
  const { titulo, detalle } = encabezado(etapa, unidades)

  const puntos = [
    ...(ubicacionCiudadano ? [{ latitude: ubicacionCiudadano.latitud, longitude: ubicacionCiudadano.longitud }] : []),
    ...unidades.flatMap((unidad) =>
      unidad.posicion ? [{ latitude: unidad.posicion.latitud, longitude: unidad.posicion.longitud }] : [],
    ),
  ]
  const puntosEncuadrados = useRef(0)

  useEffect(() => {
    // Se encuadra al ciudadano y a las unidades cuando aparece un punto nuevo, no en cada posición que llega.
    if (puntos.length > puntosEncuadrados.current) {
      puntosEncuadrados.current = puntos.length
      mapa.current?.fitToCoordinates(puntos, {
        edgePadding: { top: margenes.top + 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      })
    }
  }, [puntos, margenes.top])

  return (
    <YStack flex={1} bg="$fondo">
      <MapView
        ref={mapa}
        style={{ flex: 1 }}
        initialRegion={
          puntos[0] ? { ...puntos[0], latitudeDelta: 0.03, longitudeDelta: 0.03 } : undefined
        }
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        userInterfaceStyle={esquema}
      >
        {ubicacionCiudadano ? <MarcadorCiudadano {...ubicacionCiudadano} /> : null}
        {unidades.map((unidad) =>
          unidad.posicion ? (
            <MarcadorUnidad
              key={unidad.ambulanciaId}
              placa={unidad.placa}
              posicion={unidad.posicion}
              desactualizada={posicionDesactualizada(unidad.posicion.en, ahora)}
            />
          ) : null,
        )}
      </MapView>

      <YStack
        maxH="55%"
        mt={-22}
        gap={16}
        px={20}
        pt={12}
        pb={margenes.bottom + 20}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
      >
        <YStack self="center" width={40} height={5} rounded={999} bg="$borde" />
        <YStack gap={4}>
          <H1 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            {titulo}
          </H1>
          <Text color="$textoSecundario" fontSize={15}>
            {detalle}
          </Text>
        </YStack>
        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10 }}>
          {unidades.map((unidad) => (
            <TarjetaUnidad key={unidad.ambulanciaId} unidad={unidad} ahora={ahora} />
          ))}
        </ScrollView>
      </YStack>
    </YStack>
  )
}
