import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import { Button, useTheme } from 'tamagui'

import { useSimulador } from './simulador'

/**
 * Entrada al modo demostración, al lado de la marca. Se pinta en rojo mientras hay una ubicación inventada cargada,
 * para que nadie la confunda con la de verdad.
 */
export function BotonDemo() {
  const tema = useTheme()
  const simulador = useSimulador()
  const activo = simulador.recorrido !== null

  return (
    <Button
      width={44}
      height={44}
      p={0}
      rounded={999}
      bg={activo ? '$primario' : '$superficie'}
      borderColor={activo ? '$primario' : '$borde'}
      aria-label="Modo demostración"
      onPress={() => router.push('/demo')}
    >
      <Feather name="map-pin" size={18} color={activo ? '#FFFFFF' : tema.textoSecundario?.val} />
    </Button>
  )
}
