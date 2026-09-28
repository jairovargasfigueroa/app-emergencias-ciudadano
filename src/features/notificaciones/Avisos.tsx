import { usePathname } from 'expo-router'

import { DialogoActivarAvisos } from './DialogoActivarAvisos'
import { useNotificaciones } from './useNotificaciones'

/**
 * Las pantallas por donde se pide ayuda: ahí no se pregunta nada. Quien abre la app en una emergencia no puede
 * encontrarse una hoja tapando el botón.
 */
const CAMINO_DE_LA_ALERTA = ['/', '/pin']

/**
 * Lo que corre mientras hay un ciudadano registrado, en cualquier pantalla: los avisos push de su alerta y de sus
 * traslados. Lo único que pinta es la hoja que pregunta si los quiere, que sale una sola vez y fuera del camino de la
 * alerta: por ejemplo en el seguimiento, recién enviada la alerta, que es cuando más sentido tiene el aviso.
 */
export function Avisos({ ciudadanoId }: { ciudadanoId: number }) {
  const ruta = usePathname()
  const { preguntar, activar, descartar } = useNotificaciones(ciudadanoId)
  return (
    <DialogoActivarAvisos
      abierto={preguntar && !CAMINO_DE_LA_ALERTA.includes(ruta)}
      onActivar={activar}
      onCerrar={descartar}
    />
  )
}
