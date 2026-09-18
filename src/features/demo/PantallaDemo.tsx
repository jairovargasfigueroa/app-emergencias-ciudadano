import Feather from '@expo/vector-icons/Feather'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Paragraph, Text, XStack, YStack, useTheme } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { textoDistancia } from './geo'
import { borrarRecorrido, largoEnMetros, leerRecorridos, type Recorrido } from './recorridos'
import {
  cargarRecorrido,
  olvidarRecorrido,
  pausar,
  reiniciar,
  reproducir,
  useSimulador,
  VELOCIDADES,
} from './simulador'

/**
 * Modo demostración: se elige un punto o un recorrido dibujado antes y la app lo usa como si fuera su GPS. Para pedir
 * ayuda desde un lugar cualquiera basta un punto fijo; el recorrido sirve para ver la pantalla mientras uno se mueve.
 */
export function PantallaDemo() {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  const simulador = useSimulador()
  const [recorridos, setRecorridos] = useState<Recorrido[]>([])
  const [velocidad, setVelocidad] = useState<number>(VELOCIDADES[0].kmh)

  useFocusEffect(
    useCallback(() => {
      void leerRecorridos().then(setRecorridos)
    }, []),
  )

  async function borrar(recorrido: Recorrido) {
    if (simulador.recorrido?.id === recorrido.id) {
      olvidarRecorrido()
    }
    await borrarRecorrido(recorrido.id)
    setRecorridos(await leerRecorridos())
  }

  return (
    <YStack flex={1} bg="$fondo" pt={margenes.top + 12} pb={margenes.bottom + 16}>
      <XStack items="center" gap={12} px={16} pb={12}>
        <Button
          width={48}
          height={48}
          p={0}
          rounded={999}
          bg="$superficie"
          borderColor="$borde"
          aria-label="Volver"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={tema.texto?.val} />
        </Button>
        <YStack flex={1}>
          <Text color="$texto" fontSize={20} lineHeight={26} fontWeight="600">
            Modo demostración
          </Text>
          <Text color="$textoSecundario" fontSize={13} lineHeight={18}>
            La ubicación sale de acá, no del GPS
          </Text>
        </YStack>
      </XStack>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}>
        {simulador.recorrido ? (
          <Reproductor velocidad={velocidad} onVelocidad={setVelocidad} />
        ) : (
          <YStack gap={6} p={16} rounded={16} borderWidth={1} borderColor="$borde" bg="$superficie">
            <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
              Sin ubicación inventada
            </Text>
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              La app está usando el GPS del teléfono, como siempre. Elige un punto para pedir ayuda desde otro lugar.
            </Paragraph>
          </YStack>
        )}

        <YStack gap={10}>
          <Text color="$textoTenue" fontSize={12} fontWeight="500">
            Guardados
          </Text>
          {recorridos.length === 0 ? (
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              Todavía no hay ninguno. Toca el mapa una vez para un punto fijo, o varias veces para armar un recorrido.
            </Paragraph>
          ) : (
            recorridos.map((recorrido) => {
              const cargado = simulador.recorrido?.id === recorrido.id
              const detalle =
                recorrido.puntos.length === 1
                  ? 'Punto fijo'
                  : `${recorrido.puntos.length} puntos · ${textoDistancia(largoEnMetros(recorrido.puntos))}`
              return (
                <XStack
                  key={recorrido.id}
                  items="center"
                  gap={10}
                  pl={14}
                  rounded={14}
                  borderWidth={cargado ? 2 : 1}
                  borderColor={cargado ? '$primario' : '$borde'}
                  bg="$superficie"
                >
                  <YStack flex={1} py={10} onPress={() => cargarRecorrido(recorrido)}>
                    <Text color="$texto" fontSize={15} fontWeight="500" numberOfLines={1}>
                      {recorrido.nombre}
                    </Text>
                    <Text color="$textoSecundario" fontSize={13}>
                      {detalle}
                    </Text>
                  </YStack>
                  <Button
                    width={48}
                    height={48}
                    p={0}
                    chromeless
                    aria-label={`Borrar ${recorrido.nombre}`}
                    onPress={() => void borrar(recorrido)}
                  >
                    <Feather name="trash-2" size={18} color={tema.textoSecundario?.val} />
                  </Button>
                </XStack>
              )
            })
          )}
        </YStack>

        <BotonPrincipal onPress={() => router.push('/demo/recorrido')}>
          <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
            Marcar en el mapa
          </Button.Text>
        </BotonPrincipal>
      </ScrollView>
    </YStack>
  )
}

function Reproductor({ velocidad, onVelocidad }: { velocidad: number; onVelocidad: (kmh: number) => void }) {
  const simulador = useSimulador()
  const puntoFijo = simulador.total === 0
  const termino = simulador.total > 0 && simulador.avance >= simulador.total

  return (
    <YStack gap={14} p={16} rounded={16} borderWidth={1} borderColor="$primario" bg="$superficie">
      <YStack gap={2}>
        <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600" numberOfLines={1}>
          {simulador.recorrido?.nombre}
        </Text>
        <Text color="$textoSecundario" fontSize={13}>
          {puntoFijo
            ? 'Punto fijo: la app cree que estás ahí'
            : termino
              ? 'Llegó al final del recorrido'
              : `${textoDistancia(simulador.avance)} de ${textoDistancia(simulador.total)}`}
        </Text>
      </YStack>

      {puntoFijo ? null : (
        <>
          <XStack gap={8}>
            {VELOCIDADES.map((opcion) => {
              const elegida = opcion.kmh === velocidad
              return (
                <Button
                  key={opcion.kmh}
                  flex={1}
                  height={48}
                  px={0}
                  rounded={12}
                  borderWidth={1}
                  bg={elegida ? '$primario' : '$fondo'}
                  borderColor={elegida ? '$primario' : '$borde'}
                  onPress={() => onVelocidad(opcion.kmh)}
                >
                  <Button.Text color={elegida ? '$primarioTexto' : '$texto'} fontSize={14} fontWeight="500">
                    {`${opcion.etiqueta} · ${opcion.kmh}`}
                  </Button.Text>
                </Button>
              )
            })}
          </XStack>

          <XStack gap={8}>
            <BotonPrincipal
              flex={1}
              onPress={() => (simulador.reproduciendo ? pausar() : reproducir(velocidad))}
              disabled={termino}
              opacity={termino ? 0.5 : 1}
            >
              <Button.Text color="$primarioTexto" fontSize={16} fontWeight="600">
                {simulador.reproduciendo ? 'Pausar' : 'Empezar'}
              </Button.Text>
            </BotonPrincipal>
            <Button height={48} px={16} rounded={14} bg="$fondo" borderColor="$borde" onPress={reiniciar}>
              <Button.Text color="$texto" fontSize={15} fontWeight="500">
                Reiniciar
              </Button.Text>
            </Button>
          </XStack>
        </>
      )}

      <Button height={48} rounded={14} chromeless onPress={olvidarRecorrido}>
        <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
          Volver al GPS del teléfono
        </Button.Text>
      </Button>
    </YStack>
  )
}
