import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { RefreshControl, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { trasladoVigente, type Traslado } from './api'
import { misTrasladosQuery } from './queries'
import { TarjetaTraslado } from './TarjetaTraslado'

/**
 * Los traslados del ciudadano: los próximos arriba y el historial abajo. El que repite entra por "Pedir otra
 * vez" y no vuelve a llenar nada, que es el caso más frecuente de todos.
 */
export function PantallaTraslados() {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const traslados = useQuery(misTrasladosQuery())
  const [refrescando, setRefrescando] = useState(false)

  // El indicador es solo el del refresco que se pidió con el dedo: el automático de cada medio minuto no tiene por
  // qué mostrar nada. Sin señal la consulta queda en pausa, y ahí el indicador no se queda girando.
  async function refrescar() {
    setRefrescando(true)
    await traslados.refetch()
    setRefrescando(false)
  }

  // Con la lista ya cargada, un refresco que falla no la tapa: se sigue viendo lo último que se supo, con un aviso.
  const aviso = !traslados.data
    ? null
    : traslados.fetchStatus === 'paused'
      ? 'Sin conexión. La lista se actualiza sola cuando vuelva la señal.'
      : traslados.isRefetchError
        ? 'No pudimos actualizar la lista. Desliza hacia abajo para reintentar.'
        : null

  // Los próximos van por la fecha del viaje, el más cercano arriba: el de mañana importa antes que el de la semana
  // que viene, aunque se haya pedido después. El historial queda como viene, del más reciente al más viejo.
  const proximos = (traslados.data ?? [])
    .filter((traslado) => trasladoVigente(traslado.estado))
    .sort((uno, otro) => momentoDelViaje(uno) - momentoDelViaje(otro))
  const anteriores = (traslados.data ?? []).filter((traslado) => !trasladoVigente(traslado.estado))

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: margenes.top + 16, paddingBottom: 24, paddingHorizontal: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refrescando && traslados.fetchStatus === 'fetching'}
          onRefresh={refrescar}
          tintColor={tema.primario?.val}
          colors={tema.primario ? [tema.primario.val] : undefined}
          progressBackgroundColor={tema.superficie?.val}
          // En Android el indicador sale desde arriba de todo: sin esto queda debajo de la barra de estado.
          progressViewOffset={margenes.top}
        />
      }
    >
      <YStack gap={20}>
        <YStack gap={4}>
          <H1 color="$texto" fontSize={26} lineHeight={32} fontWeight="600">
            Traslados
          </H1>
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            Para llevar a alguien a una consulta, a diálisis o de vuelta a su casa.
          </Paragraph>
        </YStack>

        <BotonPrincipal onPress={() => router.push('/pedir-traslado')}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Pedir traslado
          </Button.Text>
        </BotonPrincipal>

        {!traslados.data ? (
          traslados.isError ? (
            <Text fontSize={14} lineHeight={20} color="$textoSecundario">
              No pudimos cargar tus traslados. Desliza hacia abajo para reintentar.
            </Text>
          ) : (
            <XStack items="center" gap={8} py={12}>
              <Spinner size="small" color="$textoSecundario" />
              <Text fontSize={14} color="$textoSecundario">
                Cargando tus traslados…
              </Text>
            </XStack>
          )
        ) : (
          <>
            {aviso ? (
              <XStack items="center" gap={8} px={12} py={10} rounded={12} bg="$enAtencionTinte">
                <Feather name="alert-circle" size={16} color={tema.enAtencionTexto?.val} />
                <Text color="$enAtencionTexto" fontSize={13} lineHeight={18} flex={1}>
                  {aviso}
                </Text>
              </XStack>
            ) : null}

            {proximos.length > 0 ? (
              <Grupo titulo="Próximos">
                {proximos.map((traslado) => (
                  <TarjetaTraslado key={traslado.id} traslado={traslado} />
                ))}
              </Grupo>
            ) : null}

            {anteriores.length > 0 ? (
              <Grupo titulo="Anteriores">
                {anteriores.map((traslado) => (
                  <TarjetaTraslado key={traslado.id} traslado={traslado} />
                ))}
              </Grupo>
            ) : null}

            {proximos.length === 0 && anteriores.length === 0 ? (
              <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
                Todavía no pediste ningún traslado.
              </Paragraph>
            ) : null}
          </>
        )}
      </YStack>
    </ScrollView>
  )
}

/** Cuándo es el viaje: la hora de la cita, o la salida si es para lo antes posible. */
function momentoDelViaje(traslado: Traslado) {
  return new Date(traslado.horaCita ?? traslado.horaSalidaEstimada).getTime()
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <YStack gap={10}>
      <Text fontSize={12} fontWeight="600" color="$textoTenue" letterSpacing={0.6}>
        {titulo.toUpperCase()}
      </Text>
      <YStack gap={10}>{children}</YStack>
    </YStack>
  )
}
