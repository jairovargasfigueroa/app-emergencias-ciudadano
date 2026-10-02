import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { describirArchivo, ErrorCaptura, type ArchivoDeEvidencia } from './archivo'
import { DURACION_MAXIMA_AUDIO_S } from './formatos'

/** M4A (AAC en MPEG-4) en mono: es voz, y así cinco minutos pesan unos 2,5 MB. */
const OPCIONES: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64_000,
}

type Manejadores = {
  alTerminar: (archivo: ArchivoDeEvidencia) => void
  alFallar: (error: unknown) => void
}

/**
 * Grabadora de un audio de hasta cinco minutos. Se corta sola al llegar al máximo; lo grabado se entrega igual,
 * listo para subir, como si la persona hubiera tocado "Detener".
 */
export function useGrabadoraAudio({ alTerminar, alFallar }: Manejadores) {
  const grabadora = useAudioRecorder(OPCIONES)
  const estado = useAudioRecorderState(grabadora, 250)
  const [empezando, setEmpezando] = useState(false)
  // Detener a mano y el corte por tiempo pueden llegar juntos: el audio se entrega una sola vez.
  const terminando = useRef(false)
  const segundos = Math.min(Math.floor(estado.durationMillis / 1000), DURACION_MAXIMA_AUDIO_S)

  async function empezar() {
    if (estado.isRecording || empezando) {
      return
    }
    setEmpezando(true)
    try {
      const permiso = await requestRecordingPermissionsAsync()
      if (!permiso.granted) {
        throw new ErrorCaptura('Para grabar un audio, permite el uso del micrófono en los ajustes del teléfono.')
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      await grabadora.prepareToRecordAsync()
      terminando.current = false
      grabadora.record({ forDuration: DURACION_MAXIMA_AUDIO_S })
    } catch (error) {
      alFallar(error instanceof ErrorCaptura ? error : new ErrorCaptura('No pudimos empezar a grabar. Intenta de nuevo.'))
    } finally {
      setEmpezando(false)
    }
  }

  async function detener() {
    if (terminando.current) {
      return
    }
    terminando.current = true
    try {
      if (grabadora.isRecording) {
        await grabadora.stop()
      }
      await soltarMicrofono()
      if (!grabadora.uri) {
        throw new ErrorCaptura('No pudimos guardar el audio. Intenta de nuevo.')
      }
      alTerminar(await describirArchivo(grabadora.uri, 'audio/mp4', 'AUDIO'))
    } catch (error) {
      alFallar(error)
    }
  }

  /** Corta sin entregar nada: la persona se arrepintió. */
  async function descartar() {
    terminando.current = true
    if (grabadora.isRecording) {
      await grabadora.stop().catch(() => {})
    }
    await soltarMicrofono()
  }

  // La grabadora se corta sola al llegar al máximo (o si una llamada le quita el micrófono). Si deja de grabar sin que
  // nadie la detuviera, lo grabado se entrega igual.
  const grababa = useRef(false)
  const entregarAlCortarse = useEffectEvent(() => {
    void detener()
  })
  useEffect(() => {
    if (grababa.current && !estado.isRecording && !terminando.current) {
      entregarAlCortarse()
    }
    grababa.current = estado.isRecording
  }, [estado.isRecording])

  return {
    grabando: estado.isRecording,
    empezando,
    segundos,
    restantes: DURACION_MAXIMA_AUDIO_S - segundos,
    empezar,
    detener,
    descartar,
  }
}

/** Devuelve el audio del teléfono a la normalidad, para no dejar el micrófono tomado. */
function soltarMicrofono() {
  return setAudioModeAsync({ allowsRecording: false }).catch(() => {})
}
