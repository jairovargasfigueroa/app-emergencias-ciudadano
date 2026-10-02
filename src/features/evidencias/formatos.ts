/*
 * Lo que el servidor acepta como evidencia (`FormatoEvidencia` y `EvidenciaProperties` del backend). El servidor lo
 * vuelve a revisar al firmar la subida; acá se repite para avisar antes de gastar datos en un archivo que no va a pasar.
 */

/** `Modalidad` del backend: cada una tiene su propio límite de tamaño. */
export type Modalidad = 'IMAGEN' | 'AUDIO' | 'VIDEO'

/** Cuántas evidencias puede adjuntar el ciudadano a una misma alerta. */
export const MAXIMO_POR_ALERTA = 5

const MIB = 1024 * 1024

/** Límites por modalidad, iguales a los del servidor. */
export const LIMITE_BYTES: Record<Modalidad, number> = {
  IMAGEN: 10 * MIB,
  AUDIO: 20 * MIB,
  VIDEO: 20 * MIB,
}

/** Un minuto de video a calidad media entra holgado en el límite. */
export const DURACION_MAXIMA_VIDEO_S = 60

export const DURACION_MAXIMA_AUDIO_S = 300

/** Lado mayor de la foto ya preparada: alcanza para ver una herida o una placa y pesa poco. */
export const LADO_MAYOR_FOTO = 1600

export const COMPRESION_FOTO = 0.7

/** Los videos que se aceptan, por extensión, para cuando el selector no dice el tipo. */
const VIDEOS: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
}

/**
 * Tipo de un video tal como lo pide el servidor, o `null` si no es uno que acepte. Se queda con el MIME limpio, sin
 * parámetros, porque es el que el almacén va a exigir en la subida.
 */
export function mimeDeVideo(mimeType: string | null | undefined, uri: string): string | null {
  const limpio = mimeType?.split(';')[0].trim().toLowerCase()
  if (limpio && Object.values(VIDEOS).includes(limpio)) {
    return limpio
  }
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  return VIDEOS[extension] ?? null
}

/** "20 MB": para los mensajes. Se dice MB aunque sean MiB, que es como lo lee cualquiera. */
export function megas(bytes: number) {
  return `${Math.round(bytes / MIB)} MB`
}
