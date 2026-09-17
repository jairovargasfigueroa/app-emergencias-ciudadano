import { createV5Theme, defaultConfig } from '@tamagui/config/v5'
import { animations } from '@tamagui/config/v5-rn'
import { createFont, createTamagui } from 'tamagui'

import { coloresClaro, coloresOscuro } from '@/tema/colores'

// Escala de 12 pasos que usa la plantilla v5 para $background, $borderColor, $color y los temas de Button/Input.
// Los colores de marca exactos llegan aparte por getTheme.
const paletaClara = [
  '#FFFFFF', '#F7F7F8', '#EFEFF1', '#E7E7EA', '#D4D4D8', '#BDBDC4',
  '#A1A1AA', '#8B8B94', '#71717A', '#52525B', '#3F3F46', '#18181B',
]
const paletaOscura = [
  '#0B0B0E', '#111114', '#1A1A1F', '#2A2A31', '#3F3F46', '#52525B',
  '#71717A', '#8B8B94', '#A1A1AA', '#D4D4D8', '#E4E4E7', '#F4F4F5',
]

const themes = createV5Theme({
  lightPalette: paletaClara,
  darkPalette: paletaOscura,
  getTheme: ({ scheme }) => (scheme === 'dark' ? coloresOscuro : coloresClaro),
})

// Misma escala de tamaños que v5 en nativo, para no desajustar Button, Input y los títulos.
const tamanos = {
  1: 11, 2: 12, 3: 15, 4: 17, true: 17, 5: 20, 6: 22, 7: 24, 8: 28,
  9: 32, 10: 40, 11: 46, 12: 52, 13: 60, 14: 70, 15: 85, 16: 100,
}
const altoLineaTexto = {
  1: 16, 2: 17, 3: 20, 4: 22, true: 22, 5: 25, 6: 27, 7: 29, 8: 33,
  9: 37, 10: 45, 11: 51, 12: 57, 13: 65, 14: 75, 15: 90, 16: 105,
}
const altoLineaTitulo = {
  1: 13, 2: 14, 3: 18, 4: 20, true: 20, 5: 24, 6: 26, 7: 29, 8: 34,
  9: 38, 10: 48, 11: 55, 12: 62, 13: 72, 14: 84, 15: 102, 16: 120,
}

// En Android los pesos solo se aplican con `face`: cada peso apunta a la fuente cargada con useFonts.
const carasPlexSans = {
  '400': { normal: 'IBMPlexSans_400Regular' },
  '500': { normal: 'IBMPlexSans_500Medium' },
  '600': { normal: 'IBMPlexSans_600SemiBold' },
}

const body = createFont({
  family: 'IBMPlexSans_400Regular',
  size: tamanos,
  lineHeight: altoLineaTexto,
  weight: { 1: '400' },
  letterSpacing: { 1: 0 },
  face: carasPlexSans,
})

const heading = createFont({
  family: 'IBMPlexSans_400Regular',
  size: tamanos,
  lineHeight: altoLineaTitulo,
  weight: { 1: '600' },
  letterSpacing: { 1: 0 },
  face: carasPlexSans,
})

const mono = createFont({
  family: 'IBMPlexMono_500Medium',
  size: tamanos,
  lineHeight: altoLineaTexto,
  weight: { 1: '500' },
  letterSpacing: { 1: 0 },
  face: { '500': { normal: 'IBMPlexMono_500Medium' } },
})

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  // Animaciones con el Animated de React Native: el driver de reanimated tiene fallos conocidos en SDK 57.
  animations,
  themes,
  fonts: { body, heading, mono },
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
})

export default tamaguiConfig

export type ConfigTamagui = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends ConfigTamagui {}
}
