import { useEffect, useState } from 'react'

/** Hora actual que se renueva cada `intervaloMs`, para cronómetros y textos como "hace 4 s" que deben avanzar solos. */
export function useAhora(intervaloMs = 1000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const temporizador = setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => clearInterval(temporizador)
  }, [intervaloMs])
  return ahora
}
