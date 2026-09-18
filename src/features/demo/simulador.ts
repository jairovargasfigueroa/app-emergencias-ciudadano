import { useSyncExternalStore } from 'react'

import type { Coordenadas } from '@/features/alerta/ubicacion'

import { distanciaEnMetros } from './geo'

import type { Recorrido } from './recorridos'

/** Cada cuánto entrega una posición nueva, igual de seguido que un GPS real. */
const INTERVALO_MS = 3000

/** Imprecisión que se le suma a cada punto, en metros: sin esto el avance se ve como un tren sobre rieles. */
const IMPRECISION_M = 4

export const VELOCIDADES = [
  { etiqueta: 'A pie', kmh: 5 },
  { etiqueta: 'Ciudad', kmh: 30 },
  { etiqueta: 'Rápido', kmh: 60 },
] as const

export type EstadoSimulador = {
  recorrido: Recorrido | null
  reproduciendo: boolean
  /** Metros avanzados sobre el recorrido. */
  avance: number
  total: number
  posicion: Coordenadas | null
}

const SIN_RECORRIDO: EstadoSimulador = {
  recorrido: null,
  reproduciendo: false,
  avance: 0,
  total: 0,
  posicion: null,
}

let estado: EstadoSimulador = SIN_RECORRIDO
/** Distancia acumulada hasta cada punto del recorrido, para saber en qué tramo cae el avance. */
let acumuladas: number[] = []
let reloj: ReturnType<typeof setInterval> | null = null
let velocidadKmh = 30
const oyentes = new Set<() => void>()

/** El estado del simulador para las pantallas de demostración. */
export function useSimulador() {
  return useSyncExternalStore(suscribir, () => estado)
}

/** La posición inventada del momento, o `null` si no hay ninguna cargada. Es lo que la app usa en vez del GPS. */
export function posicionSimulada(): Coordenadas | null {
  return estado.posicion
}

/** Para avisar fuera de React, por ejemplo al envío de posiciones. Devuelve cómo dejar de escuchar. */
export function suscribirAlSimulador(oyente: () => void) {
  return suscribir(oyente)
}

/** Deja listo un recorrido en su primer punto, sin avanzar todavía. */
export function cargarRecorrido(recorrido: Recorrido) {
  detenerReloj()
  acumuladas = distanciasAcumuladas(recorrido.puntos)
  publicar({
    recorrido,
    reproduciendo: false,
    avance: 0,
    total: acumuladas[acumuladas.length - 1] ?? 0,
    posicion: recorrido.puntos[0] ?? null,
  })
}

export function reproducir(kmh: number) {
  if (!estado.recorrido || estado.reproduciendo) {
    return
  }
  velocidadKmh = kmh
  publicar({ ...estado, reproduciendo: true })
  reloj = setInterval(avanzar, INTERVALO_MS)
}

export function pausar() {
  detenerReloj()
  publicar({ ...estado, reproduciendo: false })
}

/** Vuelve al primer punto del recorrido cargado. */
export function reiniciar() {
  detenerReloj()
  publicar({ ...estado, reproduciendo: false, avance: 0, posicion: estado.recorrido?.puntos[0] ?? null })
}

/** Apaga el simulador: la app vuelve a usar el GPS del teléfono. */
export function olvidarRecorrido() {
  detenerReloj()
  acumuladas = []
  publicar(SIN_RECORRIDO)
}

function avanzar() {
  const siguiente = Math.min(estado.avance + (velocidadKmh / 3.6) * (INTERVALO_MS / 1000), estado.total)
  const llego = siguiente >= estado.total
  if (llego) {
    detenerReloj()
  }
  publicar({
    ...estado,
    reproduciendo: !llego,
    avance: siguiente,
    posicion: conImprecision(posicionEn(siguiente)),
  })
}

/** Punto del recorrido a esa distancia del inicio, interpolando dentro del tramo que le toca. */
function posicionEn(metros: number): Coordenadas | null {
  const puntos = estado.recorrido?.puntos
  if (!puntos || puntos.length === 0) {
    return null
  }
  const indice = acumuladas.findIndex((acumulada) => acumulada >= metros)
  if (indice <= 0) {
    return puntos[0]
  }
  const tramo = acumuladas[indice] - acumuladas[indice - 1]
  const parte = tramo === 0 ? 0 : (metros - acumuladas[indice - 1]) / tramo
  const desde = puntos[indice - 1]
  const hasta = puntos[indice]
  return {
    latitud: desde.latitud + (hasta.latitud - desde.latitud) * parte,
    longitud: desde.longitud + (hasta.longitud - desde.longitud) * parte,
  }
}

/** Un metro son unos 0,000009 grados de latitud; en longitud depende de qué tan lejos del ecuador se esté. */
function conImprecision(posicion: Coordenadas | null): Coordenadas | null {
  if (!posicion) {
    return null
  }
  const grados = IMPRECISION_M / 111_320
  const porLongitud = Math.max(Math.cos((posicion.latitud * Math.PI) / 180), 0.1)
  return {
    latitud: posicion.latitud + (Math.random() - 0.5) * 2 * grados,
    longitud: posicion.longitud + ((Math.random() - 0.5) * 2 * grados) / porLongitud,
  }
}

function distanciasAcumuladas(puntos: Coordenadas[]): number[] {
  let acumulada = 0
  return puntos.map((punto, indice) => {
    if (indice > 0) {
      acumulada += distanciaEnMetros(puntos[indice - 1], punto)
    }
    return acumulada
  })
}

function detenerReloj() {
  if (reloj) {
    clearInterval(reloj)
    reloj = null
  }
}

function publicar(nuevo: EstadoSimulador) {
  estado = nuevo
  oyentes.forEach((oyente) => oyente())
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
