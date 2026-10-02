import { CryptoDigestAlgorithm, digest } from 'expo-crypto'
import { File } from 'expo-file-system'

import { LIMITE_BYTES, megas, type Modalidad } from './formatos'

/** Un archivo listo para subir: lo que el servidor pide para firmar la subida, más dónde está en el teléfono. */
export type ArchivoDeEvidencia = {
  uri: string
  mimeType: string
  modalidad: Modalidad
  tamanoBytes: number
  /** SHA-256 del contenido, en hexadecimal. El almacén rechaza un archivo que no dé exactamente esto. */
  sha256: string
}

/** Algo que impide adjuntar el archivo, con el mensaje listo para mostrar. */
export class ErrorCaptura extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorCaptura'
  }
}

const NOMBRE_MODALIDAD: Record<Modalidad, string> = {
  IMAGEN: 'La foto',
  AUDIO: 'El audio',
  VIDEO: 'El video',
}

/**
 * Tamaño y SHA-256 del archivo, leídos del archivo mismo y no de lo que diga el selector. El tamaño se revisa antes de
 * leer el contenido: un video que no entra no vale el tiempo de calcular su huella.
 */
export async function describirArchivo(uri: string, mimeType: string, modalidad: Modalidad): Promise<ArchivoDeEvidencia> {
  const archivo = new File(uri)
  const tamanoBytes = archivo.size
  if (!tamanoBytes) {
    throw new ErrorCaptura('No pudimos leer el archivo. Intenta de nuevo.')
  }
  const limite = LIMITE_BYTES[modalidad]
  if (tamanoBytes > limite) {
    throw new ErrorCaptura(`${NOMBRE_MODALIDAD[modalidad]} pesa más de ${megas(limite)} y no se puede enviar.`)
  }

  const huella = await digest(CryptoDigestAlgorithm.SHA256, await archivo.bytes())
  return { uri, mimeType, modalidad, tamanoBytes, sha256: hexadecimal(huella) }
}

function hexadecimal(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
