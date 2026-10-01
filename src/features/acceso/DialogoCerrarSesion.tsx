import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertDialog, Button, Spinner, YStack } from 'tamagui'

import { seguimientoEnCursoQuery } from '@/features/seguimiento/queries'
import { trasladoVigente } from '@/features/traslados/api'
import { misTrasladosQuery } from '@/features/traslados/queries'

import { cerrarSesionDelCiudadano } from './queries'

type Props = {
  abierto: boolean
  onCerrar: () => void
}

/**
 * Cerrar sesión se confirma antes, diciendo qué deja de pasar en este teléfono. Al confirmar, la app vuelve sola a la
 * pantalla de ingreso, con el número ya escrito.
 */
export function DialogoCerrarSesion({ abierto, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const [saliendo, setSaliendo] = useState(false)
  const alertaEnCurso = useQuery(seguimientoEnCursoQuery()).data != null
  // Lo que la app ya sabe: la lista que trajo la pestaña de traslados. No se le pregunta al servidor solo por este texto.
  const traslados = useQuery({ ...misTrasladosQuery(), enabled: false }).data
  const trasladosPendientes = traslados?.filter((traslado) => trasladoVigente(traslado.estado)).length ?? 0

  async function salir() {
    // No se vuelve a habilitar: cuando termina, esta pantalla ya no está. Lo que tarda es avisarle al servidor, con un
    // tope de un par de segundos.
    setSaliendo(true)
    try {
      await cerrarSesionDelCiudadano(queryClient)
    } catch {
      // A esta altura la app ya volvió al ingreso: lo que falló fue borrar algo del almacén, y no hay más que hacer.
    }
  }

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(siguiente) => {
        if (!siguiente && !saliendo) {
          onCerrar()
        }
      }}
    >
      <AlertDialog.Portal px={24}>
        <AlertDialog.Overlay
          key="velo"
          bg="$velo"
          transition="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <AlertDialog.Content
          key="contenido"
          width="100%"
          maxW={400}
          gap={18}
          p={24}
          rounded={22}
          bg="$superficie"
          borderColor="$borde"
          transition="quick"
          enterStyle={{ opacity: 0, scale: 0.96 }}
          exitStyle={{ opacity: 0, scale: 0.96 }}
        >
          <YStack gap={6}>
            <AlertDialog.Title color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
              ¿Cerrar sesión?
            </AlertDialog.Title>
            <AlertDialog.Description color="$textoSecundario" fontSize={15} lineHeight={22}>
              {loQueDejaDePasar(alertaEnCurso, trasladosPendientes)}
            </AlertDialog.Description>
          </YStack>

          <YStack gap={10}>
            <Button
              height={52}
              rounded={14}
              bg="$primario"
              borderWidth={0}
              disabled={saliendo}
              opacity={saliendo ? 0.6 : 1}
              icon={saliendo ? <Spinner color="$primarioTexto" /> : undefined}
              pressStyle={{ bg: '$primarioPresionado' }}
              onPress={salir}
            >
              <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
                Cerrar sesión
              </Button.Text>
            </Button>
            <AlertDialog.Cancel asChild>
              <Button height={52} rounded={14} bg="$superficie" borderColor="$bordeFuerte" disabled={saliendo}>
                <Button.Text color="$texto" fontSize={16} fontWeight="500">
                  Cancelar
                </Button.Text>
              </Button>
            </AlertDialog.Cancel>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

/**
 * Lo que deja de pasar en este teléfono. Lo que está en curso pesa más que los avisos de siempre, y una alerta más que
 * un traslado: con la alerta hay una ambulancia en camino.
 */
function loQueDejaDePasar(alertaEnCurso: boolean, trasladosPendientes: number): string {
  if (alertaEnCurso) {
    return 'Tienes una alerta en curso. Si cierras sesión, dejarás de ver a la ambulancia en este teléfono.'
  }
  if (trasladosPendientes > 0) {
    const cuantos = trasladosPendientes === 1 ? 'un traslado pendiente' : `${trasladosPendientes} traslados pendientes`
    return `Tienes ${cuantos}. Si cierras sesión, dejarás de recibir sus avisos en este teléfono.`
  }
  return 'En este teléfono dejarás de recibir los avisos de tus alertas y traslados.'
}
