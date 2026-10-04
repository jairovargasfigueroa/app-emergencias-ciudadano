import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  UIImagePickerControllerQualityType,
  type ImagePickerAsset,
  type ImagePickerResult,
} from 'expo-image-picker'

import { describirArchivo, ErrorCaptura, type ArchivoDeEvidencia } from './archivo'
import { COMPRESION_FOTO, DURACION_MAXIMA_VIDEO_S, LADO_MAYOR_FOTO, mimeDeVideo } from './formatos'

/*
 * Las tres formas de mostrar lo que pasa con la cámara o la galería. Cada una devuelve el archivo listo para subir, o
 * `null` si la persona se arrepintió; lo que impide adjuntarlo llega como `ErrorCaptura`, con el mensaje para mostrar.
 */

export async function tomarFoto(): Promise<ArchivoDeEvidencia | null> {
  await exigirCamara('tomar una foto')
  const asset = primerAsset(await launchCameraAsync({ mediaTypes: 'images', quality: 1, exif: false }))
  return asset ? prepararFoto(asset) : null
}

export async function grabarVideo(): Promise<ArchivoDeEvidencia | null> {
  await exigirCamara('grabar un video')
  const asset = primerAsset(
    await launchCameraAsync({
      mediaTypes: 'videos',
      videoMaxDuration: DURACION_MAXIMA_VIDEO_S,
      // Solo iOS respeta la calidad; en Android manda la app de cámara, y el límite de tamaño hace de red.
      videoQuality: UIImagePickerControllerQualityType.Medium,
    }),
  )
  return asset ? prepararVideo(asset) : null
}

/**
 * El selector del sistema no pide permiso de galería: la persona elige un archivo y la app solo ve ese. Solo fotos: el
 * video queda fuera por ahora (B2).
 */
export async function elegirDeGaleria(): Promise<ArchivoDeEvidencia | null> {
  const asset = primerAsset(await launchImageLibraryAsync({ mediaTypes: 'images', quality: 1, exif: false }))
  return asset ? prepararFoto(asset) : null
}

/**
 * La foto se vuelve a codificar como JPEG con el lado mayor en 1600 px. Así pesa poco, una foto HEIC del iPhone llega
 * en un formato que el servidor acepta y se pierde casi todo el EXIF, ubicación incluida.
 */
async function prepararFoto(asset: ImagePickerAsset): Promise<ArchivoDeEvidencia> {
  const contexto = ImageManipulator.manipulate(asset.uri)
  if (Math.max(asset.width, asset.height) > LADO_MAYOR_FOTO) {
    contexto.resize(asset.width >= asset.height ? { width: LADO_MAYOR_FOTO } : { height: LADO_MAYOR_FOTO })
  }
  try {
    const imagen = await contexto.renderAsync()
    const guardada = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: COMPRESION_FOTO })
    imagen.release()
    return await describirArchivo(guardada.uri, 'image/jpeg', 'IMAGEN')
  } catch (error) {
    if (error instanceof ErrorCaptura) {
      throw error
    }
    throw new ErrorCaptura('No pudimos preparar la foto. Intenta con otra.')
  } finally {
    contexto.release()
  }
}

/** El video va tal cual: recodificarlo en el teléfono tarda demasiado para una emergencia. */
async function prepararVideo(asset: ImagePickerAsset): Promise<ArchivoDeEvidencia> {
  const mimeType = mimeDeVideo(asset.mimeType, asset.uri)
  if (!mimeType) {
    throw new ErrorCaptura('Ese video está en un formato que no podemos enviar. Prueba con otro.')
  }
  return describirArchivo(asset.uri, mimeType, 'VIDEO')
}

async function exigirCamara(para: string) {
  const permiso = await requestCameraPermissionsAsync()
  if (!permiso.granted) {
    throw new ErrorCaptura(`Para ${para}, permite el uso de la cámara en los ajustes del teléfono.`)
  }
}

function primerAsset(resultado: ImagePickerResult) {
  return resultado.canceled ? null : (resultado.assets[0] ?? null)
}
