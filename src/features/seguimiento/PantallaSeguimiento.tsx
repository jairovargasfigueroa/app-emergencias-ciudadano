import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Paragraph, Text, XStack, YStack, useToastController } from 'tamagui'

import type { MotivoRetiro } from '@/features/alerta/api'
import { retirarPedidoMutation } from '@/features/alerta/queries'
import type { Coordenadas } from '@/features/alerta/ubicacion'
import { BotonDemo } from '@/features/demo/BotonDemo'
import { DEMO } from '@/features/demo/bandera'
import { mensajeDeError } from '@/shared/api/cliente'
import { useAhora } from '@/shared/reloj/useAhora'

import { DialogoRetirarPedido } from './DialogoRetirarPedido'
import { HojaBuscando } from './HojaBuscando'
import { HojaConcluida } from './HojaConcluida'
import { HojaUnidades } from './HojaUnidades'
import { MapaSeguimiento } from './MapaSeguimiento'
import { PreguntasIncidente } from './PreguntasIncidente'
import { olvidarSeguimiento, seguimientoEnCursoQuery } from './queries'
import { useSeguimiento } from './useSeguimiento'
import { vistaDeSeguimiento, type VistaSeguimiento } from './vista'

/** Datos de la alerta que llegan desde la pantalla que la emitió. Solo el id del incidente es obligatorio. */
export type ParametrosSeguimiento = {
  incidenteId: string
  alertaId?: string
  enviadaEn?: string
  latitud?: string
  longitud?: string
  origen?: string
}

/** Porcentaje del alto de la pantalla: Tamagui no acepta cualquier `string` como medida. */
type Porcentaje = `${number}%`

/**
 * Alto de la hoja en cada momento. Al principio ocupa bastante, porque el mapa no tiene nada más que mostrar que el
 * punto del ciudadano; encoge cuando aparecen unidades y vuelve a crecer para dar el cierre.
 */
const ALTOS_DE_HOJA: Record<VistaSeguimiento['tipo'], { minH?: Porcentaje; maxH: Porcentaje }> = {
  buscando: { minH: '52%', maxH: '74%' },
  acudiendo: { maxH: '56%' },
  concluido: { minH: '46%', maxH: '82%' },
}

/**
 * PB-06: una sola pantalla para todo el caso. El mapa nunca se va y la hoja de abajo cambia de contenido y de alto,
 * en vez de repintar la pantalla entera justo cuando llega la buena noticia.
 */
export function PantallaSeguimiento() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const parametros = useLocalSearchParams<ParametrosSeguimiento>()
  const ahora = useAhora()
  const toast = useToastController()
  const { cargando, error, seguimiento } = useSeguimiento(Number(parametros.incidenteId))
  const vista = vistaDeSeguimiento(seguimiento)
  const [altoHoja, setAltoHoja] = useState(0)
  const [retirando, setRetirando] = useState(false)
  const enCurso = useQuery(seguimientoEnCursoQuery()).data
  const retiro = useMutation(retirarPedidoMutation(queryClient))

  const concluido = vista.tipo === 'concluido'
  const unidades = vista.tipo === 'acudiendo' && seguimiento ? seguimiento.unidades : []
  const alertaId = Number(parametros.alertaId)
  // Los detalles se aceptan mientras el incidente siga abierto y ninguna unidad haya llegado al lugar. Sin el primer
  // dato de Firebase eso todavía no se sabe, así que no se pregunta.
  const aunSeAceptanDetalles = vista.tipo === 'buscando' || (vista.tipo === 'acudiendo' && vista.etapa === 'EN_CAMINO')
  const puedePreguntar = !cargando && aunSeAceptanDetalles && Number.isFinite(alertaId) && alertaId > 0
  const altos = ALTOS_DE_HOJA[vista.tipo]

  // El pedido se retira mientras ninguna unidad haya llegado al lugar: desde ahí lo resuelve quien está allí.
  const hayUnidadEnCamino = vista.tipo === 'acudiendo' && vista.etapa === 'EN_CAMINO'
  const pedidoRetirado = enCurso?.pedidoRetirado === true
  const puedeRetirar =
    !cargando && !pedidoRetirado && Number.isFinite(alertaId) && alertaId > 0 &&
    (vista.tipo === 'buscando' || hayUnidadEnCamino)

  function retirarPedido(motivo: MotivoRetiro, emisorEsPaciente: boolean) {
    retiro.mutate(
      { alertaId, datos: { motivo, emisorEsPaciente } },
      {
        onSuccess: () => setRetirando(false),
        onError: (error: unknown) => {
          setRetirando(false)
          toast.show('No se pudo retirar tu pedido', { message: mensajeDeError(error) })
        },
      },
    )
  }

  useEffect(() => {
    // PB-06 R4: con el incidente en estado final ya no hay caso al que volver al abrir la app.
    if (concluido) {
      void olvidarSeguimiento(queryClient)
    }
  }, [concluido, queryClient])

  return (
    <YStack flex={1} bg="$fondo">
      <MapaSeguimiento
        ubicacionCiudadano={coordenadasDeParametros(parametros.latitud, parametros.longitud)}
        unidades={unidades}
        apagado={concluido}
        margenInferior={altoHoja}
        ahora={ahora}
      />

      {/* El botón del modo demostración vive en el inicio, y con un caso abierto el inicio ya no se ve. */}
      {DEMO ? (
        <XStack position="absolute" t={margenes.top + 12} l={16} z={1}>
          <BotonDemo />
        </XStack>
      ) : null}

      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        minH={altos.minH}
        maxH={altos.maxH}
        pt={12}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
        shadowColor="#000000"
        shadowOpacity={0.1}
        shadowRadius={24}
        shadowOffset={{ width: 0, height: -8 }}
        elevation={12}
        onLayout={(evento) => setAltoHoja(evento.nativeEvent.layout.height)}
      >
        <YStack self="center" width={40} height={5} mb={12} rounded={999} bg="$borde" />
        <ScrollView
          style={{ flexGrow: 0, flexShrink: 1 }}
          contentContainerStyle={{ gap: 16, paddingHorizontal: 20, paddingBottom: margenes.bottom + 20 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {vista.tipo === 'concluido' ? (
            <HojaConcluida estado={vista.estado} />
          ) : (
            <>
              {vista.tipo === 'acudiendo' ? (
                <HojaUnidades unidades={unidades} etapa={vista.etapa} ahora={ahora} />
              ) : (
                <HojaBuscando
                  enviadaEn={parametros.enviadaEn}
                  origen={parametros.origen}
                  conectando={cargando}
                  sinTiempoReal={error}
                  ahora={ahora}
                />
              )}
              {/* Las preguntas conservan su sitio en el árbol: al aparecer unidades no se pierde lo contestado. */}
              {puedePreguntar ? <PreguntasIncidente alertaId={alertaId} /> : null}

              {/* Retirar el pedido no corta el viaje de nadie: si hay unidad en camino, ella decide. */}
              {pedidoRetirado ? (
                <YStack gap={4} px={14} py={12} rounded={14} borderWidth={1} borderColor="$borde">
                  <Text color="$texto" fontSize={15} fontWeight="600">
                    Retiraste tu pedido
                  </Text>
                  <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
                    {hayUnidadEnCamino
                      ? 'Le avisamos a la unidad que ya no la necesitás. Ella decide si sigue o se vuelve.'
                      : 'Ya podés volver a pedir ayuda cuando quieras.'}
                  </Paragraph>
                </YStack>
              ) : null}

              {puedeRetirar ? (
                <Button height={48} rounded={14} chromeless onPress={() => setRetirando(true)}>
                  <Button.Text color="$textoSecundario" fontSize={15} fontWeight="500">
                    Ya no necesito la ambulancia
                  </Button.Text>
                </Button>
              ) : null}
            </>
          )}
        </ScrollView>
      </YStack>

      <DialogoRetirarPedido
        abierto={retirando}
        enviando={retiro.isPending}
        conUnidadEnCamino={hayUnidadEnCamino}
        onConfirmar={retirarPedido}
        onCerrar={() => setRetirando(false)}
      />
    </YStack>
  )
}

function coordenadasDeParametros(latitud?: string, longitud?: string): Coordenadas | null {
  const lat = Number(latitud)
  const lon = Number(longitud)
  return latitud && longitud && Number.isFinite(lat) && Number.isFinite(lon) ? { latitud: lat, longitud: lon } : null
}
