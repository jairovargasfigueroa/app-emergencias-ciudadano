import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'react-native'

import { coloresClaro, coloresOscuro } from '@/tema/colores'

/**
 * La app pasó a tener dos cosas que hacer: pedir ayuda ya y pedir un traslado para después. La emergencia queda
 * primera y es la pestaña que abre, porque es la que se usa sin pensar.
 */
export default function LayoutPestanas() {
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const colores = esquema === 'dark' ? coloresOscuro : coloresClaro

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarStyle: { backgroundColor: colores.superficie, borderTopColor: colores.borde },
        tabBarLabelStyle: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Emergencia',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="emergency" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="traslados"
        options={{
          title: 'Traslados',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="local-shipping" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menú',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="menu" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
