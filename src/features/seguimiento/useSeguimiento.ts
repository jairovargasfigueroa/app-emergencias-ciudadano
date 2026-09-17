import { onValue, ref, type DataSnapshot } from 'firebase/database'
import { useEffect, useState } from 'react'

import { baseDatosFirebase } from '@/shared/firebase/baseDatos'

import { esEstadoAtencion, esEstadoFinal, type Seguimiento, type UnidadSeguimiento } from './api'

export type EstadoSeguimiento = {
  /** Todavía no llegó ningún dato de Firebase para este incidente. */
  cargando: boolean
  error: boolean
  /** `null` mientras el servidor no publicó el seguimiento del incidente. */
  seguimiento: Seguimiento | null
}

/** Lo último que llegó de Firebase y de qué incidente era. */
type Recibido = {
  incidenteId: number
  error: boolean
  seguimiento: Seguimiento | null
}

/**
 * Escucha el seguimiento del incidente en tiempo real. Al llegar a un estado final deja de escuchar y conserva ese
 * último estado (PB-06 R4 y CA-07).
 */
export function useSeguimiento(incidenteId: number): EstadoSeguimiento {
  const [recibido, setRecibido] = useState<Recibido | null>(null)

  useEffect(() => {
    let finalizado = false
    let dejarDeEscuchar: (() => void) | null = null

    dejarDeEscuchar = onValue(
      ref(baseDatosFirebase(), `seguimiento/${incidenteId}`),
      (snapshot) => {
        const seguimiento = snapshot.exists() ? leerSeguimiento(snapshot) : null
        setRecibido({ incidenteId, error: false, seguimiento })
        if (seguimiento && esEstadoFinal(seguimiento.estado)) {
          finalizado = true
          dejarDeEscuchar?.()
        }
      },
      () =>
        setRecibido((previo) => ({
          incidenteId,
          error: true,
          seguimiento: previo?.incidenteId === incidenteId ? previo.seguimiento : null,
        })),
    )
    // Con datos en caché, Firebase puede avisar antes de devolver la función para dejar de escuchar.
    if (finalizado) {
      dejarDeEscuchar()
    }

    return () => dejarDeEscuchar?.()
  }, [incidenteId])

  // Lo recibido de otro incidente no vale: hasta el primer dato de este, se está conectando.
  if (recibido?.incidenteId !== incidenteId) {
    return { cargando: true, error: false, seguimiento: null }
  }
  return { cargando: false, error: recibido.error, seguimiento: recibido.seguimiento }
}

function leerSeguimiento(snapshot: DataSnapshot): Seguimiento {
  const unidades: UnidadSeguimiento[] = []
  // Las unidades usan el id de la ambulancia como clave: se recorren con forEach para no recibir un arreglo con huecos.
  snapshot.child('unidades').forEach((hijo) => {
    const unidad = hijo.val() as Omit<UnidadSeguimiento, 'ambulanciaId'>
    // Se filtra antes de pintar o calcular la etapa: un estado que la app no conoce no puede tumbar la pantalla (R2).
    if (esEstadoAtencion(unidad?.estado)) {
      unidades.push({ ...unidad, ambulanciaId: Number(hijo.key) })
    }
  })
  const valor = snapshot.val() as Omit<Seguimiento, 'unidades'>
  return {
    incidenteId: valor.incidenteId,
    estado: valor.estado,
    actualizadoEn: valor.actualizadoEn,
    unidades: unidades.sort((a, b) => a.placa.localeCompare(b.placa)),
  }
}
