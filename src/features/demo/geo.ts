import type { Coordenadas } from '@/features/alerta/ubicacion'

const RADIO_TIERRA_M = 6_371_000

/** Distancia en metros entre dos puntos (fórmula del haversine). Solo la usa el modo demostración. */
export function distanciaEnMetros(desde: Coordenadas, hasta: Coordenadas): number {
  const aRadianes = (grados: number) => (grados * Math.PI) / 180
  const dLat = aRadianes(hasta.latitud - desde.latitud)
  const dLon = aRadianes(hasta.longitud - desde.longitud)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(desde.latitud)) * Math.cos(aRadianes(hasta.latitud)) * Math.sin(dLon / 2) ** 2
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(a))
}

/** "500 m" por debajo de un kilómetro; "2,1 km" por encima. */
export function textoDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros / 10) * 10} m`
  }
  const km = metros / 1000
  return `${km < 10 ? km.toFixed(1).replace('.', ',') : String(Math.round(km))} km`
}
