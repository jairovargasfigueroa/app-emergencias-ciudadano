import type { Sesion } from './almacen'

/**
 * Cuándo vence el token de la sesión, en milisegundos, o `null` si no se puede saber. Las sesiones guardadas antes de
 * que el servidor informara `venceEn` lo sacan del `exp` del propio token.
 */
export function venceEnMs(sesion: Sesion<unknown>): number | null {
  if (sesion.venceEn) {
    const instante = Date.parse(sesion.venceEn)
    if (!Number.isNaN(instante)) {
      return instante
    }
  }
  const exp = expDelToken(sesion.token)
  return exp === null ? null : exp * 1000
}

/**
 * El `exp` de un JWT, en segundos, o `null`. Su parte central es JSON en base64url. No se verifica la firma: es el token
 * de la propia sesión y solo sirve para decidir cuándo renovarlo; el que decide si vale es el servidor.
 */
function expDelToken(token: string): number | null {
  const partes = token.split('.')
  if (partes.length !== 3) {
    return null
  }
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const conRelleno = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const datos: unknown = JSON.parse(atob(conRelleno))
    return typeof datos === 'object' && datos !== null && 'exp' in datos && typeof datos.exp === 'number'
      ? datos.exp
      : null
  } catch {
    return null
  }
}
