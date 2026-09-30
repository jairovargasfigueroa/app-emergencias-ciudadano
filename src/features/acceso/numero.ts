/** Código de Bolivia. La persona escribe solo los 8 dígitos de su celular y la app le antepone este prefijo. */
export const PREFIJO_PAIS = '+591'

/**
 * Los dígitos del número como se marca dentro del país: "+591 7123-4567" queda "71234567". Limpia lo que se pega o lo
 * que completa el teclado, y el teléfono de las cuentas viejas, que se escribía a mano.
 */
export function numeroNacional(texto: string): string {
  const digitos = texto.replace(/\D/g, '')
  return digitos.length === 11 && digitos.startsWith('591') ? digitos.slice(3) : digitos
}

/** Un celular boliviano: 8 dígitos. */
export function esNumeroValido(numero: string): boolean {
  return /^\d{8}$/.test(numero)
}

/** El número completo, en formato E.164, como lo pide Firebase y como lo devuelve al verificarlo: +59171234567. */
export function numeroInternacional(numero: string): string {
  return `${PREFIJO_PAIS}${numero}`
}
