import { Paragraph } from 'tamagui'

/** Junta los errores de un campo de TanStack Form: con Zod llegan como objetos con `message`. */
export function textoDeErrores(errores: readonly unknown[]): string | null {
  const mensajes = errores
    .map((error) => {
      if (typeof error === 'string') {
        return error
      }
      if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message)
      }
      return null
    })
    .filter((mensaje): mensaje is string => Boolean(mensaje))
  return mensajes.length > 0 ? mensajes.join(' ') : null
}

export function MensajeDeCampo({ texto }: { texto: string | null }) {
  if (!texto) {
    return null
  }
  return (
    <Paragraph role="alert" color="$primarioPresionado" fontSize={13} lineHeight={18}>
      {texto}
    </Paragraph>
  )
}
