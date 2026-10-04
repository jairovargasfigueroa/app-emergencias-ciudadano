import Feather from '@expo/vector-icons/Feather'
import { useState } from 'react'
import { Button, Paragraph, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import { ErrorCaptura, type ArchivoDeEvidencia } from '@/features/evidencias/archivo'
import { elegirDeGaleria, tomarFoto } from '@/features/evidencias/captura'
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
import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import { FilaEvidencia } from './FilaEvidencia'
import { GrabadoraAudio } from './GrabadoraAudio'
import { NotaUsoDeDatos } from './NotaUsoDeDatos'

type Opcion = 'audio' | 'foto' | 'galeria'

// El video queda fuera por ahora (B2): pesa más y su análisis tarda. `grabarVideo` sigue en `captura.ts` para volver.
const CAPTURAS: Record<Exclude<Opcion, 'audio'>, () => Promise<ArchivoDeEvidencia | null>> = {
  foto: tomarFoto,
  galeria: elegirDeGaleria,
}

/**
 * La galería solo existe en pruebas (B3): una foto guardada puede ser vieja o de otro lugar, y facilita fingir una
 * emergencia. En producción la evidencia se captura en el momento. Para probarla en un build de producción, se
 * compila con `EXPO_PUBLIC_PERMITIR_GALERIA=true` en `.env.local`.
 */
const PERMITIR_GALERIA = __DEV__ || process.env.EXPO_PUBLIC_PERMITIR_GALERIA === 'true'

/**
 * "Mostrar lo que pasa": un audio o una foto para quien atiende, todo opcional. La alerta ya salió y nada de
 * esto la frena: cada archivo se envía por su lado, con su avance, y si se corta la señal sigue cuando vuelve.
 */
export function PasoEvidencias({ alertaId }: { alertaId: number }) {
  const tema = useTheme()
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
            Un audio o una foto ayudan a que lleguen preparados. Tu alerta ya salió.
          </Paragraph>
          {/* Antes que cualquier botón: nadie tiene que acercarse a un peligro para mandar una foto. */}
          <XStack items="center" gap={8} pt={6}>
            <Feather name="alert-triangle" size={16} color={tema.enAtencionTexto?.val} />
            <Text color="$texto" fontSize={15} lineHeight={20} fontWeight="600">
              Solo si es seguro para ti.
            </Text>
          </XStack>
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
          // El audio va primero y en grande: contar lo que pasa es lo que más ayuda, como en una llamada. La foto
          // muestra el lugar. Los dos a todo el ancho, fáciles de acertar con prisa, y con lo que conviene mandar.
          <YStack gap={12}>
            <BotonOpcion
              principal
              texto="Enviar audio"
              guia="Cuenta qué pasó, cuántas personas hay y cómo están."
              icono="mic"
              preparando={false}
              apagado={ocupado}
              onPress={() => void elegir('audio')}
            />
            <BotonOpcion
              texto="Tomar foto"
              guia="Una foto de la persona herida y del lugar."
              icono="camera"
              preparando={preparando === 'foto'}
              apagado={ocupado && preparando !== 'foto'}
              onPress={() => void elegir('foto')}
            />
            {PERMITIR_GALERIA ? (
              <BotonGaleria
                preparando={preparando === 'galeria'}
                apagado={ocupado && preparando !== 'galeria'}
                onPress={() => void elegir('galeria')}
              />
            ) : null}
            <NotaUsoDeDatos />
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
  /** Qué conviene mandar, debajo del botón: quien atiende necesita eso, no cualquier cosa. */
  guia: string
  icono: 'mic' | 'camera'
  /** La acción que más ayuda: roja y más alta, para que sea la primera que se ve. */
  principal?: boolean
  /** Esta opción está abriendo la cámara o preparando el archivo. */
  preparando: boolean
  /** Otra opción está en curso: esta espera su turno. */
  apagado: boolean
  onPress: () => void
}

function BotonOpcion({ texto, guia, icono, principal = false, preparando, apagado, onPress }: PropsBotonOpcion) {
  const tema = useTheme()
  const Boton = principal ? BotonPrincipal : Button
  const colorTexto = principal ? '$primarioTexto' : '$texto'
  const colorIcono = (principal ? tema.primarioTexto : tema.texto)?.val

  return (
    <YStack gap={6}>
      <Boton
        height={principal ? 72 : 60}
        px={16}
        rounded={14}
        borderWidth={principal ? 0 : 1}
        borderColor="$borde"
        bg={principal ? '$primario' : '$fondo'}
        pressStyle={{ bg: principal ? '$primarioPresionado' : '$borde' }}
        disabled={preparando || apagado}
        opacity={apagado ? 0.45 : 1}
        icon={
          preparando ? (
            <Spinner color={colorTexto} />
          ) : (
            <Feather name={icono} size={principal ? 24 : 20} color={colorIcono} />
          )
        }
        aria-busy={preparando}
        aria-label={texto}
        onPress={onPress}
      >
        <Button.Text color={colorTexto} fontSize={principal ? 18 : 16} fontWeight="600" numberOfLines={2}>
          {preparando ? 'Preparando…' : texto}
        </Button.Text>
      </Boton>
      <Text color="$textoSecundario" fontSize={13} lineHeight={18} px={4}>
        {guia}
      </Text>
    </YStack>
  )
}

/** Una foto ya guardada, solo en pruebas: acción chica, debajo de las que capturan en el momento. */
type PropsBotonGaleria = Pick<PropsBotonOpcion, 'preparando' | 'apagado' | 'onPress'>

function BotonGaleria({ preparando, apagado, onPress }: PropsBotonGaleria) {
  const tema = useTheme()

  return (
    <Button
      height={44}
      rounded={14}
      chromeless
      disabled={preparando || apagado}
      opacity={apagado ? 0.45 : 1}
      icon={
        preparando ? (
          <Spinner color="$textoSecundario" />
        ) : (
          <Feather name="image" size={16} color={tema.textoSecundario?.val} />
        )
      }
      aria-busy={preparando}
      aria-label="Elegir de la galería"
      onPress={onPress}
    >
      <Button.Text color="$textoSecundario" fontSize={14} fontWeight="500">
        {preparando ? 'Preparando…' : 'Elegir de la galería'}
      </Button.Text>
    </Button>
  )
}
