import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'
import { Insignia } from '@/shared/ui/Insignia'

import { trasladoVigente, type EstadoTraslado, type Traslado } from './api'
import { misTrasladosQuery } from './queries'
import { TEXTO_ESTADO } from './textos'

/**
 * Los traslados del ciudadano: los próximos arriba y el historial abajo. El que repite entra por "Pedir otra
 * vez" y no vuelve a llenar nada, que es el caso más frecuente de todos.
 */
export function PantallaTraslados() {
  const margenes = useSafeAreaInsets()
  const traslados = useQuery(misTrasladosQuery())

  const proximos = (traslados.data ?? []).filter((traslado) => trasladoVigente(traslado.estado))
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
            No pudimos cargar tus traslados. Bajá para reintentar.
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

const TONO: Record<EstadoTraslado, 'verde' | 'ambar' | 'gris'> = {
  PROGRAMADO: 'gris',
  BUSCANDO_UNIDAD: 'ambar',
  ASIGNADO: 'verde',
  COMPLETADO: 'gris',
  NO_REALIZADO: 'gris',
  NO_CUBIERTO: 'ambar',
  CANCELADO: 'gris',
}

function TarjetaTraslado({ traslado }: { traslado: Traslado }) {
  return (
    <YStack
      gap={6}
      p={14}
      rounded={14}
      bg="$superficie"
      borderWidth={1}
      borderColor="$borde"
      pressStyle={{ bg: '$fondo' }}
      onPress={() => router.push({ pathname: '/traslado/[trasladoId]', params: { trasladoId: String(traslado.id) } })}
    >
      <XStack items="center" justify="space-between" gap={8}>
        <Text fontSize={16} fontWeight="600" color="$texto" flex={1} numberOfLines={1}>
          {traslado.pasajero}
        </Text>
        <Insignia tono={TONO[traslado.estado]}>{TEXTO_ESTADO[traslado.estado]}</Insignia>
      </XStack>
      <Text fontSize={13} color="$textoSecundario">
        {cuando(traslado)}
      </Text>
      <Text fontSize={13} color="$textoSecundario" numberOfLines={1}>
        {traslado.origenReferencia ?? 'Origen en el mapa'} → {traslado.centroSaludDestino ?? 'Destino en el mapa'}
      </Text>
    </YStack>
  )
}

function cuando(traslado: Traslado) {
  if (!traslado.horaCita) {
    return 'Pedido para lo antes posible'
  }
  const fecha = new Date(traslado.horaCita)
  const dia = fecha.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })
  const hora = fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
  return `${dia} · tiene que estar ${hora}`
}
