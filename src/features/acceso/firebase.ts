import {
  getAuth,
  getIdToken,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from '@react-native-firebase/auth'

import { numeroInternacional } from './numero'

/**
 * Cierra la verificación de Firebase. Firebase solo prueba que la persona tiene el teléfono en la mano; la sesión de la
 * app la abre el servidor, así que esta se cierra apenas se entra. Si no había ninguna abierta, no pasa nada.
 */
export function cerrarVerificacion() {
  return signOut(getAuth()).catch(() => {})
}

/**
 * Firebase manda un SMS con el código al número; al confirmarlo, entrega un ID token con el número verificado. Una
 * verificación que quedó abierta de un intento anterior se cierra antes, para que no se tome por la de este envío.
 */
export async function enviarCodigo(numero: string): Promise<ConfirmationResult> {
  const auth = getAuth()
  if (auth.currentUser) {
    await cerrarVerificacion()
  }
  return signInWithPhoneNumber(auth, numeroInternacional(numero))
}

/** El usuario de Firebase que verificó este número, o `null` si todavía no se verificó. */
export function usuarioVerificado(numero: string) {
  const usuario = getAuth().currentUser
  return usuario?.phoneNumber === numeroInternacional(numero) ? usuario : null
}

/**
 * El ID token que prueba el número, o `null` si ya no hay un usuario que lo haya verificado. Vale una hora: si venció,
 * Firebase entrega uno nuevo sin pedir otro SMS, así que sirve aunque la persona tarde en escribir su nombre.
 */
export async function idTokenDelNumero(numero: string): Promise<string | null> {
  const usuario = usuarioVerificado(numero)
  return usuario ? getIdToken(usuario) : null
}

const MENSAJE_CODIGO_INVALIDO = 'El código no es correcto o ya venció. Revísalo o pide otro.'

/** Textos para los errores de Firebase que la persona puede resolver. Los códigos vienen del SDK nativo. */
const MENSAJES_DE_FIREBASE: Record<string, string> = {
  'auth/invalid-verification-code': MENSAJE_CODIGO_INVALIDO,
  'auth/session-expired': MENSAJE_CODIGO_INVALIDO,
  'auth/too-many-requests': 'Hubo demasiados intentos desde este teléfono. Espera un rato antes de volver a probar.',
  'auth/quota-exceeded': 'Por ahora no podemos mandar más códigos por SMS. Intenta de nuevo más tarde.',
  'auth/network-request-failed': 'No hay conexión. Revisa tu internet y vuelve a intentarlo.',
  'auth/invalid-phone-number': 'Ese número no es válido. Revisa que sean los 8 dígitos de tu celular.',
}

/** Mensaje listo para mostrar a partir de un error de Firebase al verificar el número. */
export function mensajeDeFirebase(error: unknown): string {
  const codigo =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : null
  return (codigo ? MENSAJES_DE_FIREBASE[codigo] : undefined) ?? 'No se pudo verificar tu número. Inténtalo de nuevo.'
}
