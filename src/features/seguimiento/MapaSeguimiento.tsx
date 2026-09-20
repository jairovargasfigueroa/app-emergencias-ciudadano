import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'
import MapView from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

import type { Coordenadas } from '@/features/alerta/ubicacion'

import type { UnidadSeguimiento } from './api'
import { MarcadorCiudadano, MarcadorUnidad } from './MarcadorUnidad'
import { posicionDesactualizada } from './vista'

/** Sin unidades el mapa se queda a nivel de calle: sirve para comprobar que la ayuda va al lugar correcto. */
const DELTA_CALLE = 0.004

type Props = {
  ubicacionCiudadano: Coordenadas | null
  unidades: UnidadSeguimiento[]
  /** El incidente cerró: el mapa se queda, pero apagado (PB-06 R4). */
  apagado: boolean
  /** Alto de la hoja de abajo, para que el encuadre no meta los puntos debajo de ella. */
  margenInferior: number
  ahora: number
}

/** El mapa está desde el primer segundo y no desaparece: es lo que no cambia mientras el caso avanza. */
export function MapaSeguimiento({ ubicacionCiudadano, unidades, apagado, margenInferior, ahora }: Props) {
  const margenes = useSafeAreaInsets()
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const mapa = useRef<MapView>(null)
  const [mapaListo, setMapaListo] = useState(false)

  const puntos = [
    ...(ubicacionCiudadano ? [{ latitude: ubicacionCiudadano.latitud, longitude: ubicacionCiudadano.longitud }] : []),
    ...unidades.flatMap((unidad) =>
      unidad.posicion ? [{ latitude: unidad.posicion.latitud, longitude: unidad.posicion.longitud }] : [],
    ),
  ]
  // Qué hay en el mapa: el punto del ciudadano y las unidades que ya tienen posición, por su id. Cambia cuando entra o
  // sale una unidad (también si la única canceló y otra tomó el caso), pero no con cada posición que llega.
  const claveEncuadre = [
    ubicacionCiudadano ? `${ubicacionCiudadano.latitud},${ubicacionCiudadano.longitud}` : '',
    ...unidades.flatMap((unidad) => (unidad.posicion ? [unidad.ambulanciaId] : [])),
  ].join('|')

  // Lee los puntos y los márgenes del momento sin que sus cambios (cada posición, cada ajuste de la hoja) reencuadren.
  const encuadrar = useEffectEvent(() => {
    if (puntos.length > 1) {
      mapa.current?.fitToCoordinates(puntos, {
        edgePadding: { top: margenes.top + 60, right: 60, bottom: margenInferior + 40, left: 60 },
        animated: true,
      })
    }
  })

  useEffect(() => {
    // Se reencuadra solo cuando cambia lo que hay en el mapa, para no pelearle el mapa a la persona.
    // En Android el mapa no se puede encuadrar antes de onMapReady.
    if (mapaListo) {
      encuadrar()
    }
  }, [mapaListo, claveEncuadre])

  return (
    <>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        onMapReady={() => setMapaListo(true)}
        initialRegion={
          ubicacionCiudadano
            ? {
                latitude: ubicacionCiudadano.latitud,
                longitude: ubicacionCiudadano.longitud,
                latitudeDelta: DELTA_CALLE,
                longitudeDelta: DELTA_CALLE,
              }
            : undefined
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

      {apagado ? (
        <YStack position="absolute" t={0} b={0} l={0} r={0} bg="$fondo" opacity={0.6} pointerEvents="none" />
      ) : null}
    </>
  )
}
