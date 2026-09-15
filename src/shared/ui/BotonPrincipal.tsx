import { Button, styled } from 'tamagui'

/** Acción principal de una pantalla: roja, alta y fácil de tocar con prisa. El texto va en `Button.Text`. */
export const BotonPrincipal = styled(Button, {
  height: 56,
  rounded: 14,
  bg: '$primario',
  borderWidth: 0,
  pressStyle: { bg: '$primarioPresionado' },
})
