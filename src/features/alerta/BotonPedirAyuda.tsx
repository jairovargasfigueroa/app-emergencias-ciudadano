import Feather from '@expo/vector-icons/Feather'
import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Vibration } from 'react-native'
import { Button, Spinner, Text, YStack } from 'tamagui'

/** Toques necesarios para que salga la alerta y tiempo máximo entre uno y otro. */
const TOQUES_NECESARIOS = 3
const VENTANA_ENTRE_TOQUES_MS = 2000

/** Vibración de confirmación por toque. En iOS la duración es fija: el sistema ignora el número. */
const VIBRACION_MS = 25

const DIAMETRO_EXTERIOR = 280
const DIAMETRO_INTERIOR = 240
const GROSOR_EXTERIOR = 20
const GROSOR_INTERIOR = 18
const DIAMETRO_BOTON = 204

const TEXTOS_DE_TOQUE = ['Toca 3 veces', '2 veces más', '1 vez más']

type Props = {
  /** Se está obteniendo la posición GPS. */
  buscando: boolean
  /** La alerta ya va en camino al servidor. */
  enviando: boolean
  onCompletar: () => void
}

/**
 * PB-02 CA-01: la alerta sale al tercer toque, sin pantallas intermedias. Tres toques evitan el envío accidental sin
 * pedir una confirmación aparte; si pasan más de 2 s entre toque y toque, el conteo vuelve a cero en silencio.
 */
export function BotonPedirAyuda({ buscando, enviando, onCompletar }: Props) {
  const [toques, setToques] = useState(0)
  const conteo = useRef(0)
  const disparado = useRef(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ocupado = buscando || enviando

  useEffect(() => () => clearTimeout(temporizador.current), [])

  // El intento terminó (se pasó al pin o falló el envío): el conteo queda listo para el siguiente.
  useEffect(() => {
    if (!ocupado && disparado.current) {
      disparado.current = false
      conteo.current = 0
      setToques(0)
    }
  }, [ocupado])

  function tocar() {
    if (ocupado || disparado.current) {
      return
    }
    Vibration.vibrate(VIBRACION_MS)
    clearTimeout(temporizador.current)
    conteo.current += 1
    setToques(conteo.current)
    if (conteo.current >= TOQUES_NECESARIOS) {
      // Tercer toque: la alerta sale una sola vez, por más que se siga tocando.
      disparado.current = true
      onCompletar()
      return
    }
    temporizador.current = setTimeout(() => {
      conteo.current = 0
      setToques(0)
    }, VENTANA_ENTRE_TOQUES_MS)
  }

  const texto = enviando ? 'Enviando…' : buscando ? 'Buscando tu ubicación…' : (TEXTOS_DE_TOQUE[toques] ?? 'Enviando…')
  const progreso = Math.min(toques / TOQUES_NECESARIOS, 1)

  return (
    <YStack width={DIAMETRO_EXTERIOR} height={DIAMETRO_EXTERIOR} items="center" justify="center">
      {/* Los dos anillos llevan la cuenta: cada toque llena un tercio. */}
      <AnilloProgreso
        diametro={DIAMETRO_EXTERIOR}
        grosor={GROSOR_EXTERIOR}
        progreso={progreso}
        colorPista="$primarioTinte"
        colorAvance="$primario"
      />
      <AnilloProgreso
        diametro={DIAMETRO_INTERIOR}
        grosor={GROSOR_INTERIOR}
        progreso={progreso}
        colorPista="$primarioTinte"
        colorAvance="$primario"
        opacidadAvance={0.45}
      />
      <Button
        width={DIAMETRO_BOTON}
        height={DIAMETRO_BOTON}
        rounded={999}
        p={0}
        borderWidth={0}
        bg="$primario"
        pressStyle={{ bg: '$primarioPresionado', scale: 0.97 }}
        shadowColor="$primario"
        shadowOpacity={0.35}
        shadowRadius={18}
        shadowOffset={{ width: 0, height: 12 }}
        elevation={8}
        disabled={ocupado}
        aria-label={`Pedir ayuda. ${texto}`}
        aria-busy={ocupado}
        onPress={tocar}
      >
        <YStack items="center" gap={10}>
          {ocupado ? <Spinner size="large" color="$primarioTexto" /> : <Feather name="plus" size={40} color="#FFFFFF" />}
          <Text
            color="$primarioTexto"
            fontSize={ocupado ? 16 : 20}
            lineHeight={ocupado ? 20 : 26}
            fontWeight="600"
            text="center"
            maxW={150}
          >
            {texto}
          </Text>
        </YStack>
      </Button>
    </YStack>
  )
}

type ColorFondo = ComponentProps<typeof YStack>['bg']

type PropsAnillo = {
  diametro: number
  grosor: number
  /** 0 a 1. */
  progreso: number
  colorPista: ColorFondo
  colorAvance: ColorFondo
  opacidadAvance?: number
}

/**
 * Anillo que se llena en sentido horario. React Native no dibuja arcos y la app no carga librerías de SVG: el avance
 * se arma con dos medios discos girados y recortados, y el centro se tapa para dejar solo el aro.
 */
function AnilloProgreso({ diametro, grosor, progreso, colorPista, colorAvance, opacidadAvance = 1 }: PropsAnillo) {
  const grados = Math.min(Math.max(progreso, 0), 1) * 360
  const hueco = diametro - grosor * 2

  return (
    <YStack position="absolute" width={diametro} height={diametro} items="center" justify="center">
      <YStack position="absolute" width={diametro} height={diametro} rounded={999} bg={colorPista} />
      <MedioBarrido
        diametro={diametro}
        lado="derecha"
        grados={Math.min(grados, 180)}
        color={colorAvance}
        opacidad={opacidadAvance}
      />
      <MedioBarrido
        diametro={diametro}
        lado="izquierda"
        grados={Math.max(grados - 180, 0)}
        color={colorAvance}
        opacidad={opacidadAvance}
      />
      {/* El hueco toma el color del fondo de la pantalla: es lo que convierte el disco en anillo. */}
      <YStack position="absolute" width={hueco} height={hueco} rounded={999} bg="$fondo" />
    </YStack>
  )
}

type PropsBarrido = {
  diametro: number
  lado: 'derecha' | 'izquierda'
  /** Grados barridos dentro de esa mitad, de 0 a 180. */
  grados: number
  color: ColorFondo
  opacidad: number
}

/** Mitad del anillo: recorta media circunferencia y gira dentro un medio disco hasta cubrir los grados pedidos. */
function MedioBarrido({ diametro, lado, grados, color, opacidad }: PropsBarrido) {
  if (grados <= 0) {
    return null
  }
  const mitad = diametro / 2
  const derecha = lado === 'derecha'

  return (
    <YStack position="absolute" t={0} l={derecha ? mitad : 0} width={mitad} height={diametro} overflow="hidden">
      <YStack
        position="absolute"
        t={0}
        l={derecha ? -mitad : 0}
        width={diametro}
        height={diametro}
        style={{ transform: [{ rotate: `${grados - 180}deg` }] }}
      >
        <YStack
          position="absolute"
          t={0}
          l={derecha ? mitad : 0}
          width={mitad}
          height={diametro}
          bg={color}
          opacity={opacidad}
          borderTopLeftRadius={derecha ? 0 : mitad}
          borderBottomLeftRadius={derecha ? 0 : mitad}
          borderTopRightRadius={derecha ? mitad : 0}
          borderBottomRightRadius={derecha ? mitad : 0}
        />
      </YStack>
    </YStack>
  )
}
