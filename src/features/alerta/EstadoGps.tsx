import { Text, XStack } from 'tamagui'

import type { EstadoGps as Estado } from './ubicacion'

const VISTAS = {
  listo: { texto: 'GPS listo', fondo: '$disponibleTinte', color: '$disponibleTexto', punto: '$disponible' },
  sinPermiso: { texto: 'Sin permiso de GPS', fondo: '$enAtencionTinte', color: '$enAtencionTexto', punto: '$enAtencion' },
  apagado: { texto: 'GPS apagado', fondo: '$enAtencionTinte', color: '$enAtencionTexto', punto: '$enAtencion' },
} as const

/** Avisa antes de presionar si la alerta saldrá con GPS o pedirá fijar el pin. */
export function EstadoGps({ estado }: { estado: Estado }) {
  const vista = VISTAS[estado]
  return (
    <XStack items="center" gap={6} height={28} px={10} rounded={999} bg={vista.fondo}>
      <XStack width={7} height={7} rounded={999} bg={vista.punto} />
      <Text color={vista.color} fontSize={13} fontWeight="500">
        {vista.texto}
      </Text>
    </XStack>
  )
}
