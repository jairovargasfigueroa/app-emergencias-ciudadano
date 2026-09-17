import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Text, YStack } from 'tamagui'

import { ciudadanoQuery } from '@/features/registro/queries'
import type { SeguimientoGuardado } from '@/features/seguimiento/almacen'
import { abrirSeguimiento } from '@/features/seguimiento/navegacion'
import { MarcaSga } from '@/shared/ui/MarcaSga'

import { AvisoAlertaNoEnviada } from './AvisoAlertaNoEnviada'
import { BotonPedirAyuda } from './BotonPedirAyuda'
import { EstadoGps } from './EstadoGps'
import { alertaKeys, estadoGpsQuery } from './queries'
import { obtenerUbicacionGps, prepararPermisoDeUbicacion } from './ubicacion'
import { useEnviarAlerta } from './useEnviarAlerta'

/** Tiempo que se espera al GPS antes de ofrecer el mapa, sin esperar a que se rinda solo (PB-02 R2). */
const ESPERA_ANTES_DE_OFRECER_EL_MAPA_MS = 3000

/**
 * PB-02 CA-01 y CA-02: la alerta sale con el gesto del botón, sin pantallas intermedias; si el GPS falla, no hay
 * permiso o tarda demasiado, se pasa a marcar el punto en el mapa.
 */
export function PantallaAlerta() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const ciudadano = useQuery(ciudadanoQuery()).data
  const estadoGps = useQuery(estadoGpsQuery())
  const { enviar, empezarIntento, reintentar, enviando, esperandoConexion, rechazada } =
    useEnviarAlerta(irAlSeguimiento)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)
  const [ofrecerMapa, setOfrecerMapa] = useState(false)
  // Identifica el intento en curso: si el ciudadano se va al mapa, el GPS que llegue tarde se descarta.
  const intento = useRef(0)

  useEffect(() => {
    prepararPermisoDeUbicacion()
      .catch(() => {})
      .finally(() => queryClient.invalidateQueries({ queryKey: alertaKeys.estadoGps }))
  }, [queryClient])

  useEffect(() => {
    if (!buscandoUbicacion) {
      setOfrecerMapa(false)
      return
    }
    const temporizador = setTimeout(() => setOfrecerMapa(true), ESPERA_ANTES_DE_OFRECER_EL_MAPA_MS)
    return () => clearTimeout(temporizador)
  }, [buscandoUbicacion])

  async function pedirAyuda() {
    if (buscandoUbicacion || enviando) {
      return
    }
    empezarIntento()
    const mio = ++intento.current
    setBuscandoUbicacion(true)
    const coordenadas = await obtenerUbicacionGps()
    if (mio !== intento.current) {
      return
    }
    setBuscandoUbicacion(false)
    if (coordenadas) {
      enviar(coordenadas, 'GPS')
    } else {
      router.push('/pin')
    }
  }

  function irAlMapa() {
    // Se abandona el intento en curso para que no salga una segunda alerta si el GPS responde después.
    intento.current += 1
    setBuscandoUbicacion(false)
    router.push('/pin')
  }

  const aviso = esperandoConexion ? 'Sin conexión. La alerta se enviará en cuanto vuelva la señal.' : null

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} bg="$fondo" px={24} pt={margenes.top + 16} pb={margenes.bottom + 20} gap={20}>
        <MarcaSga tamano={32} />

        {estadoGps.data ? <EstadoGps estado={estadoGps.data} /> : null}

        <YStack flex={1} items="center" justify="center" gap={24} minH={420}>
          <YStack items="center" gap={8}>
            <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600" text="center">
              ¿Necesitas una ambulancia?
            </H1>
            <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24} text="center" maxW={300}>
              Toca el botón tres veces seguidas. Tu ubicación viaja sola, no tienes que escribir nada.
            </Paragraph>
          </YStack>

          <BotonPedirAyuda buscando={buscandoUbicacion} enviando={enviando} onCompletar={pedirAyuda} />

          <YStack self="stretch" items="center" gap={12} minH={44}>
            {rechazada ? <AvisoAlertaNoEnviada reintentando={enviando} onReintentar={reintentar} /> : null}
            {aviso ? (
              <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center" aria-live="polite">
                {aviso}
              </Paragraph>
            ) : null}
            {/* PB-02 R2: si el GPS tarda, la salida al mapa se ofrece ya, sin esperar a que se rinda solo. */}
            {ofrecerMapa ? (
              <Button height={44} rounded={14} chromeless onPress={irAlMapa}>
                <Button.Text color="$primario" fontSize={15} fontWeight="600">
                  Marcar dónde estoy en el mapa
                </Button.Text>
              </Button>
            ) : null}
          </YStack>
        </YStack>

        {ciudadano ? (
          <YStack items="center" gap={2}>
            <Text color="$textoSecundario" fontSize={13} numberOfLines={1}>
              {`Pides ayuda como ${ciudadano.nombreCompleto}`}
            </Text>
            <Text color="$textoTenue" fontSize={13} numberOfLines={1}>
              {`Te llamarán al ${ciudadano.telefono}`}
            </Text>
          </YStack>
        ) : null}
      </YStack>
    </ScrollView>
  )
}

function irAlSeguimiento(seguimiento: SeguimientoGuardado) {
  abrirSeguimiento(seguimiento)
}
