import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium'
import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular'
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans/500Medium'
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TamaguiProvider, ToastProvider, ToastViewport } from 'tamagui'

import { ciudadanoQuery } from '@/features/registro/queries'
import { seguimientoEnCursoQuery } from '@/features/seguimiento/queries'
import { queryClient, useFocoDeLaApp } from '@/shared/query/queryClient'
import { ToastActual } from '@/shared/ui/ToastActual'
import { tamaguiConfig } from '@/tamagui.config'
import { coloresClaro, coloresOscuro } from '@/tema/colores'

// Si el splash ya no se puede retener, la app sigue igual: no hay nada que hacer con el error.
SplashScreen.preventAutoHideAsync().catch(() => {})

const navegacionClara: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: coloresClaro.primario,
    background: coloresClaro.fondo,
    card: coloresClaro.superficie,
    text: coloresClaro.texto,
    border: coloresClaro.borde,
  },
}

const navegacionOscura: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: coloresOscuro.primario,
    background: coloresOscuro.fondo,
    card: coloresOscuro.superficie,
    text: coloresOscuro.texto,
    border: coloresOscuro.borde,
  },
}

export default function LayoutRaiz() {
  // React Native 0.86 puede devolver 'unspecified': Tamagui necesita siempre 'light' o 'dark'.
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const margenes = useSafeAreaInsets()
  const [fuentesListas, errorFuentes] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_500Medium,
  })
  useFocoDeLaApp()

  if (!fuentesListas && !errorFuentes) {
    return null
  }

  return (
    // QueryClientProvider va por fuera de Tamagui para que lo vea el contenido de Sheet y Dialog, que se pinta en un portal.
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={esquema}>
        <ThemeProvider value={esquema === 'dark' ? navegacionOscura : navegacionClara}>
          <ToastProvider duration={4000} swipeDirection="up">
            <StatusBar style={esquema === 'dark' ? 'light' : 'dark'} />
            <Pantallas />
            <ToastActual />
            <ToastViewport flexDirection="column-reverse" t={margenes.top + 8} l={0} r={0} />
          </ToastProvider>
        </ThemeProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  )
}

/**
 * PB-02 R1: sin registro ligero solo existe la pantalla de registro. Al registrarse, el guard cambia y el router
 * lleva solo a la pantalla del botón.
 *
 * PB-06: el caso guardado se lee antes de pintar nada. Si la app se cerró con un caso abierto, el inicio lo encuentra
 * al abrirse y lleva directo a su seguimiento; aquí no se navega, para que el seguimiento se abra una sola vez.
 */
function Pantallas() {
  const ciudadano = useQuery(ciudadanoQuery())
  const enCurso = useQuery(seguimientoEnCursoQuery())
  const listo = !ciudadano.isPending && !enCurso.isPending
  const registrado = ciudadano.data != null

  useEffect(() => {
    if (listo) {
      SplashScreen.hide()
    }
  }, [listo])

  if (!listo) {
    return null
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={registrado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pedir-traslado" />
        <Stack.Screen name="traslado/[trasladoId]" />
        <Stack.Screen name="pin" />
        <Stack.Screen name="seguimiento/[incidenteId]" />
        <Stack.Screen name="demo/index" />
        <Stack.Screen name="demo/recorrido" />
      </Stack.Protected>
      <Stack.Protected guard={!registrado}>
        <Stack.Screen name="registro" />
      </Stack.Protected>
    </Stack>
  )
}
