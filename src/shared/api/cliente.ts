/** Error de validación de un campo, tal como lo envía el backend. */
export type ErrorDeCampo = {
  campo: string
  mensaje: string
}

/** Cuerpo de error del backend: Problem Details con `codigo` y datos extra según el caso. */
export type CuerpoError = {
  status: number
  detail?: string
  codigo?: string
  errores?: ErrorDeCampo[]
  [propiedad: string]: unknown
}

export class ErrorApi extends Error {
  readonly status: number
  readonly codigo: string | undefined
  readonly cuerpo: CuerpoError

  constructor(cuerpo: CuerpoError) {
    super(cuerpo.detail ?? 'Ocurrió un error inesperado.')
    this.name = 'ErrorApi'
    this.status = cuerpo.status
    this.codigo = cuerpo.codigo
    this.cuerpo = cuerpo
  }
}

/** URL del backend, p. ej. http://192.168.0.10:8080 (el teléfono no entiende "localhost"). */
const URL_BASE = process.env.EXPO_PUBLIC_API_URL ?? ''

/** Cabecera provisional con el id del usuario mientras no exista autenticación. */
const CABECERA_USUARIO = 'X-Usuario-Id'

type OpcionesPedido = {
  metodo?: 'GET' | 'POST'
  cuerpo?: unknown
  usuarioId?: number
  signal?: AbortSignal
}

async function pedir<T>(ruta: string, { metodo = 'GET', cuerpo, usuarioId, signal }: OpcionesPedido = {}): Promise<T> {
  const cabeceras: Record<string, string> = { Accept: 'application/json' }
  if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json'
  }
  if (usuarioId !== undefined) {
    cabeceras[CABECERA_USUARIO] = String(usuarioId)
  }

  let respuesta: Response
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    throw new ErrorApi({ status: 0, detail: 'No hay conexión con el servidor. Revisa tu internet.' })
  }

  if (!respuesta.ok) {
    throw new ErrorApi(await leerCuerpoError(respuesta))
  }
  if (respuesta.status === 204) {
    return undefined as T
  }
  return (await respuesta.json()) as T
}

async function leerCuerpoError(respuesta: Response): Promise<CuerpoError> {
  try {
    const cuerpo = (await respuesta.json()) as Partial<CuerpoError>
    return { ...cuerpo, status: respuesta.status }
  } catch {
    return { status: respuesta.status, detail: 'El servidor respondió con un error.' }
  }
}

export const api = {
  get: <T>(ruta: string, opciones?: Omit<OpcionesPedido, 'metodo' | 'cuerpo'>) => pedir<T>(ruta, opciones),
  post: <T>(ruta: string, cuerpo?: unknown, opciones?: Omit<OpcionesPedido, 'metodo' | 'cuerpo'>) =>
    pedir<T>(ruta, { ...opciones, metodo: 'POST', cuerpo }),
}

/** Mensaje listo para mostrar a partir de cualquier error. */
export function mensajeDeError(error: unknown): string {
  return error instanceof ErrorApi ? error.message : 'Ocurrió un error inesperado.'
}
