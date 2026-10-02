import Feather from '@expo/vector-icons/Feather'
import { useState } from 'react'
import { Button, Paragraph, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import { ErrorCaptura, type ArchivoDeEvidencia } from '@/features/evidencias/archivo'
import { elegirDeGaleria, grabarVideo, tomarFoto } from '@/features/evidencias/captura'
import {
  adjuntar,
  lugaresLibres,
  quitar,
  reintentar,
  useEvidencias,
  useIncidenteCompleto,
} from '@/features/evidencias/cola'
import { MAXIMO_POR_ALERTA } from '@/features/evidencias/formatos'
import { MENSAJE_INCIDENTE_COMPLETO } from '@/features/evidencias/subida'

import { FilaEvidencia } from './FilaEvidencia'
import { GrabadoraAudio } from './GrabadoraAudio'

type Opcion = 'foto' | 'video' | 'galeria' | 'audio'

type Icono = 'camera' | 'video' | 'image' | 'mic'

const OPCIONES: { id: Opcion; texto: string; icono: Icono }[] = [
  { id: 'foto', texto: 'Tomar foto', icono: 'camera' },
  { id: 'video', texto: 'Grabar video', icono: 'video' },
  { id: 'galeria', texto: 'Elegir de la galería', icono: 'image' },
  { id: 'audio', texto: 'Grabar audio', icono: 'mic' },
]

const CAPTURAS: Record<Exclude<Opcion, 'audio'>, () => Promise<ArchivoDeEvidencia | null>> = {
  foto: tomarFoto,
  video: grabarVideo,
  galeria: elegirDeGaleria,
}

/**
 * "Mostrar lo que pasa": una foto, un video o un audio para quien atiende, todo opcional. La alerta ya salió y nada de
 * esto la frena: cada archivo se envía por su lado, con su avance, y si se corta la señal sigue cuando vuelve.
 */
export function PasoEvidencias({ alertaId }: { alertaId: number }) {
  const evidencias = useEvidencias(alertaId)
  const [preparando, setPreparando] = useState<Opcion | null>(null)
  const [grabandoAudio, setGrabandoAudio] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const incidenteCompleto = useIncidenteCompleto(alertaId)
  // La emergencia completa también cierra los adjuntos, aunque a esta alerta le queden lugares.
  const libres = incidenteCompleto ? 0 : lugaresLibres(evidencias)
  const ocupado = preparando !== null || grabandoAudio

  function enviar(archivo: ArchivoDeEvidencia) {
    if (!adjuntar(alertaId, archivo)) {
      setAviso(
        incidenteCompleto
          ? MENSAJE_INCIDENTE_COMPLETO
          : `Ya adjuntaste ${MAXIMO_POR_ALERTA} archivos, el máximo para una alerta.`,
      )
    }
  }

  function mostrarError(error: unknown) {
    setAviso(error instanceof ErrorCaptura ? error.message : 'No pudimos adjuntar el archivo. Intenta de nuevo.')
  }

  async function elegir(opcion: Opcion) {
    if (ocupado) {
      return
    }
    setAviso(null)
    if (opcion === 'audio') {
      setGrabandoAudio(true)
      return
    }
    setPreparando(opcion)
    try {
      const archivo = await CAPTURAS[opcion]()
      if (archivo) {
        enviar(archivo)
      }
    } catch (error) {
      mostrarError(error)
    } finally {
      setPreparando(null)
    }
  }

  return (
    <YStack gap={10}>
      <Text color="$textoTenue" fontSize={12} fontWeight="500">
        Opcional · ayuda a quien te atiende
      </Text>

      <YStack gap={14} p={16} rounded={16} borderWidth={1} borderColor="$borde" bg="$superficie">
        <YStack gap={4}>
          <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
            Mostrar lo que pasa
          </Text>
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            Una foto, un video corto o un audio ayudan a que lleguen preparados. Tu alerta ya salió.
          </Paragraph>
        </YStack>

        {grabandoAudio ? (
          <GrabadoraAudio
            onListo={(archivo) => {
              setGrabandoAudio(false)
              enviar(archivo)
            }}
            onError={mostrarError}
            onCerrar={() => setGrabandoAudio(false)}
          />
        ) : libres > 0 ? (
          // Dos filas de dos: botones anchos, fáciles de acertar con prisa.
          <YStack gap={8}>
            {[OPCIONES.slice(0, 2), OPCIONES.slice(2)].map((fila) => (
              <XStack key={fila[0].id} gap={8}>
                {fila.map((opcion) => (
                  <BotonOpcion
                    key={opcion.id}
                    texto={opcion.texto}
                    icono={opcion.icono}
                    preparando={preparando === opcion.id}
                    apagado={ocupado && preparando !== opcion.id}
                    onPress={() => void elegir(opcion.id)}
                  />
                ))}
              </XStack>
            ))}
          </YStack>
        ) : incidenteCompleto ? (
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            {`${MENSAJE_INCIDENTE_COMPLETO} Gracias.`}
          </Paragraph>
        ) : (
          <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
            {`Ya adjuntaste ${MAXIMO_POR_ALERTA} archivos, el máximo para una alerta. Gracias.`}
          </Paragraph>
        )}

        {aviso ? (
          <Paragraph color="$enAtencionTexto" fontSize={14} lineHeight={20} role="alert">
            {aviso}
          </Paragraph>
        ) : null}

        {evidencias.length > 0 ? (
          <YStack gap={8}>
            {evidencias.map((evidencia, indice) => (
              <FilaEvidencia
                key={evidencia.clave}
                evidencia={evidencia}
                numero={
                  evidencias
                    .slice(0, indice + 1)
                    .filter((otra) => otra.archivo.modalidad === evidencia.archivo.modalidad).length
                }
                onReintentar={() => reintentar(alertaId, evidencia.clave)}
                onQuitar={() => quitar(alertaId, evidencia.clave)}
              />
            ))}
          </YStack>
        ) : null}
      </YStack>
    </YStack>
  )
}

type PropsBotonOpcion = {
  texto: string
  icono: Icono
  /** Esta opción está abriendo la cámara o preparando el archivo. */
  preparando: boolean
  /** Otra opción está en curso: esta espera su turno. */
  apagado: boolean
  onPress: () => void
}

function BotonOpcion({ texto, icono, preparando, apagado, onPress }: PropsBotonOpcion) {
  const tema = useTheme()

  return (
    <Button
      flex={1}
      height={64}
      px={10}
      rounded={14}
      borderWidth={1}
      borderColor="$borde"
      bg="$fondo"
      pressStyle={{ bg: '$borde' }}
      disabled={preparando || apagado}
      opacity={apagado ? 0.45 : 1}
      icon={preparando ? <Spinner color="$texto" /> : <Feather name={icono} size={20} color={tema.texto?.val} />}
      aria-busy={preparando}
      aria-label={texto}
      onPress={onPress}
    >
      <Button.Text color="$texto" fontSize={14} fontWeight="600" numberOfLines={2}>
        {preparando ? 'Preparando…' : texto}
      </Button.Text>
    </Button>
  )
}
