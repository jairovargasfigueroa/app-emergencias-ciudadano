import { useSyncExternalStore } from 'react'

import type { CrearAlerta } from './api'

/** Detalles opcionales de la alerta (PB-02 R3): nunca bloquean la emisión. */
export type DetallesAlerta = {
  cantidadAfectados: number | null
  descripcion: string
}

export const MAXIMO_AFECTADOS = 99
export const LARGO_MAXIMO_DESCRIPCION = 2000

const SIN_DETALLES: DetallesAlerta = { cantidadAfectados: null, descripcion: '' }

let detallesActuales = SIN_DETALLES
const oyentes = new Set<() => void>()

/**
 * Los detalles se escriben en la pantalla del botón, pero la alerta puede salir desde ahí o desde el pin manual:
 * por eso viven fuera de las dos pantallas.
 */
export function useDetallesAlerta() {
  return useSyncExternalStore(suscribir, leerDetallesAlerta)
}

export function leerDetallesAlerta() {
  return detallesActuales
}

export function actualizarDetallesAlerta(cambios: Partial<DetallesAlerta>) {
  detallesActuales = { ...detallesActuales, ...cambios }
  oyentes.forEach((oyente) => oyente())
}

export function limpiarDetallesAlerta() {
  actualizarDetallesAlerta(SIN_DETALLES)
}

/** Campos opcionales de `POST /alertas`: lo que el ciudadano no llenó no se envía. */
export function camposOpcionales(detalles: DetallesAlerta): Pick<CrearAlerta, 'cantidadAfectados' | 'descripcion'> {
  const descripcion = detalles.descripcion.trim()
  return {
    cantidadAfectados: detalles.cantidadAfectados ?? undefined,
    descripcion: descripcion.length > 0 ? descripcion : undefined,
  }
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
