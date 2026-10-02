import NetInfo from '@react-native-community/netinfo'

/**
 * Espera a que el teléfono tenga red. Sin red, intentar subir solo gasta batería y termina en error: mejor quedarse
 * quieto y seguir apenas vuelva la señal. Con red desde el principio, sigue de inmediato; `alEsperar` avisa solo si de
 * verdad hay que esperar.
 */
export async function esperarConexion(signal?: AbortSignal, alEsperar?: () => void): Promise<void> {
  const estado = await NetInfo.fetch()
  if (signal?.aborted) {
    throw errorDeCancelacion()
  }
  if (estado.isConnected !== false) {
    return
  }
  alEsperar?.()
  return new Promise((resolve, reject) => {
    const dejarDeEscuchar = NetInfo.addEventListener((nuevo) => {
      if (nuevo.isConnected !== false) {
        terminar()
        resolve()
      }
    })
    const alCancelar = () => {
      terminar()
      reject(errorDeCancelacion())
    }
    function terminar() {
      dejarDeEscuchar()
      signal?.removeEventListener('abort', alCancelar)
    }
    signal?.addEventListener('abort', alCancelar)
  })
}

/** Igual al que lanza `fetch` al cancelar, para tratar las dos cancelaciones de la misma forma. */
export function errorDeCancelacion() {
  const error = new Error('Se canceló la subida.')
  error.name = 'AbortError'
  return error
}

export function esCancelacion(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}
