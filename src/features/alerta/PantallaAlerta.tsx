import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H1, Paragraph, Text, XStack, YStack } from 'tamagui'

import { ciudadanoQuery } from '@/features/registro/queries'
import { abrirSeguimiento } from '@/features/seguimiento/navegacion'
import { MarcaSga } from '@/shared/ui/MarcaSga'

import type { AlertaCreada, CrearAlerta } from './api'
import { BotonPedirAyuda } from './BotonPedirAyuda'
import { DetallesOpcionales } from './DetallesOpcionales'
import { EstadoGps } from './EstadoGps'
import { alertaKeys, estadoGpsQuery } from './queries'
import { obtenerUbicacionGps, prepararPermisoDeUbicacion } from './ubicacion'
import { useEnviarAlerta } from './useEnviarAlerta'

function irAlSeguimiento(alerta: AlertaCreada, datos: CrearAlerta) {
  abrirSeguimiento(alerta, datos)
}

/**
 * PB-02 CA-01 y CA-02: con GPS la alerta sale al presionar, sin pasos intermedios; si el GPS falla o no hay permiso,
 * se pasa a fijar el pin.
 */
export function PantallaAlerta() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const ciudadano = useQuery(ciudadanoQuery()).data
  const estadoGps = useQuery(estadoGpsQuery())
  const { enviar, enviando, esperandoConexion } = useEnviarAlerta(irAlSeguimiento)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)

  useEffect(() => {
    prepararPermisoDeUbicacion()
      .catch(() => {})
      .finally(() => queryClient.invalidateQueries({ queryKey: alertaKeys.estadoGps }))
  }, [queryClient])

  async function pedirAyuda() {
    if (buscandoUbicacion || enviando) {
      return
    }
    setBuscandoUbicacion(true)
    const coordenadas = await obtenerUbicacionGps()
    setBuscandoUbicacion(false)
    if (coordenadas) {
      enviar(coordenadas, 'GPS')
    } else {
      router.push('/pin')
    }
  }

  const aviso = esperandoConexion
    ? 'Sin conexión. La alerta se enviará en cuanto vuelva la señal.'
    : enviando
      ? 'Enviando tu alerta…'
      : buscandoUbicacion
        ? 'Obteniendo tu ubicación…'
        : null
  const primerNombre = ciudadano?.nombreCompleto.trim().split(/\s+/)[0]

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <YStack flex={1} bg="$fondo" px={24} pt={margenes.top + 16} pb={margenes.bottom + 24} gap={24}>
          <XStack items="center" justify="space-between" gap={12}>
            <XStack items="center" gap={10} shrink={1}>
              <MarcaSga tamano={32} />
              <Text color="$texto" fontSize={15} fontWeight="500" numberOfLines={1} shrink={1}>
                {primerNombre ? `Hola, ${primerNombre}` : 'Hola'}
              </Text>
            </XStack>
            {estadoGps.data ? <EstadoGps estado={estadoGps.data} /> : null}
          </XStack>

          <YStack flex={1} items="center" justify="center" gap={28} minH={420}>
            <YStack items="center" gap={8}>
              <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600" text="center">
                ¿Necesitas una ambulancia?
              </H1>
              <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24} text="center" maxW={300}>
                Presiona el botón. Tu ubicación se envía al instante.
              </Paragraph>
            </YStack>
            <BotonPedirAyuda ocupado={buscandoUbicacion || enviando} onPress={pedirAyuda} />
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20} text="center" minH={20} aria-live="polite">
              {aviso ?? ' '}
            </Paragraph>
          </YStack>

          <DetallesOpcionales />
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
