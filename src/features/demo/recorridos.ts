import * as SecureStore from 'expo-secure-store'

import type { Coordenadas } from '@/features/alerta/ubicacion'

import { distanciaEnMetros } from './geo'

/** Un camino dibujado sobre el mapa: los puntos van en el orden en que se tocaron. */
export type Recorrido = {
  id: string
  nombre: string
  puntos: Coordenadas[]
}

/**
 * Tope de puntos por recorrido. El almacenamiento del teléfono guarda valores chicos, así que cada recorrido se
 * escribe aparte y en formato compacto; con este tope entra de sobra y alcanza para dibujar varias cuadras.
 */
export const MAXIMO_PUNTOS = 80

const CLAVE_INDICE = 'demo.recorridos'
const clavePuntos = (id: string) => `demo.recorrido.${id}`

type Entrada = { id: string; nombre: string }

/** Los recorridos guardados en este teléfono. Si algo está corrupto, se ignora en vez de romper la pantalla. */
export async function leerRecorridos(): Promise<Recorrido[]> {
  const recorridos: Recorrido[] = []
  for (const entrada of await leerIndice()) {
    const puntos = await leerPuntos(entrada.id)
    if (puntos.length >= 1) {
      recorridos.push({ ...entrada, puntos })
    }
  }
  return recorridos
}

export async function guardarRecorrido(nombre: string, puntos: Coordenadas[]): Promise<Recorrido> {
  const recorrido: Recorrido = { id: String(Date.now()), nombre: nombre.trim(), puntos }
  await SecureStore.setItemAsync(clavePuntos(recorrido.id), aTexto(puntos))
  const indice = [...(await leerIndice()), { id: recorrido.id, nombre: recorrido.nombre }]
  await SecureStore.setItemAsync(CLAVE_INDICE, JSON.stringify(indice))
  return recorrido
}

export async function borrarRecorrido(id: string): Promise<void> {
  const indice = (await leerIndice()).filter((entrada) => entrada.id !== id)
  await SecureStore.setItemAsync(CLAVE_INDICE, JSON.stringify(indice))
  await SecureStore.deleteItemAsync(clavePuntos(id))
}

/** Largo del camino dibujado, sumando tramo por tramo. */
export function largoEnMetros(puntos: Coordenadas[]): number {
  return puntos.reduce(
    (total, punto, indice) => (indice === 0 ? 0 : total + distanciaEnMetros(puntos[indice - 1], punto)),
    0,
  )
}

async function leerIndice(): Promise<Entrada[]> {
  try {
    const guardado = await SecureStore.getItemAsync(CLAVE_INDICE)
    const entradas = guardado ? (JSON.parse(guardado) as Entrada[]) : []
    return Array.isArray(entradas)
      ? entradas.filter((entrada) => typeof entrada?.id === 'string' && typeof entrada?.nombre === 'string')
      : []
  } catch {
    return []
  }
}

async function leerPuntos(id: string): Promise<Coordenadas[]> {
  try {
    return desdeTexto(await SecureStore.getItemAsync(clavePuntos(id)))
  } catch {
    return []
  }
}

/** "lat,lon;lat,lon". Cinco decimales son poco más de un metro: de sobra y ocupa la mitad que un JSON. */
function aTexto(puntos: Coordenadas[]): string {
  return puntos.map((punto) => `${punto.latitud.toFixed(5)},${punto.longitud.toFixed(5)}`).join(';')
}

function desdeTexto(texto: string | null): Coordenadas[] {
  if (!texto) {
    return []
  }
  return texto
    .split(';')
    .map((par) => par.split(',').map(Number))
    .filter(([latitud, longitud]) => Number.isFinite(latitud) && Number.isFinite(longitud))
    .map(([latitud, longitud]) => ({ latitud, longitud }))
}
