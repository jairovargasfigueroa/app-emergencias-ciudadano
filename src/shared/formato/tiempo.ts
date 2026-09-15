/** Segundos enteros transcurridos desde una fecha ISO hasta `ahora`. */
export function segundosDesde(iso: string, ahora: number = Date.now()): number {
  return Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 1000))
}

/** "45 s", "2 min 14 s", "1 h 05 min": un cronómetro legible. */
export function cronometro(segundos: number): string {
  if (segundos < 60) {
    return `${segundos} s`
  }
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) {
    return `${minutos} min ${String(segundos % 60).padStart(2, '0')} s`
  }
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`
}

/** "hace 40 s", "hace 3 min", "hace 2 h". */
export function haceCuanto(segundos: number): string {
  if (segundos < 60) {
    return `hace ${segundos} s`
  }
  const minutos = Math.floor(segundos / 60)
  return minutos < 60 ? `hace ${minutos} min` : `hace ${Math.floor(minutos / 60)} h`
}

/** "14:32" en la hora local del teléfono. */
export function horaCorta(iso: string): string {
  const fecha = new Date(iso)
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}
