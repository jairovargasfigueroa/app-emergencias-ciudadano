import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'

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
  const traslados = useQuery(misTrasladosQuery())

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

        {traslados.isPending ? (
          <XStack items="center" gap={8} py={12}>
            <Spinner size="small" color="$textoSecundario" />
            <Text fontSize={14} color="$textoSecundario">
              Cargando tus traslados…
            </Text>
          </XStack>
        ) : traslados.isError ? (
          <Text fontSize={14} color="$textoSecundario">
            No pudimos cargar tus traslados. Baja para reintentar.
          </Text>
        ) : (
          <>
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
