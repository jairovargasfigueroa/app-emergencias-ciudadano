import { DialogoActivarAvisos } from './DialogoActivarAvisos'
import { useNotificaciones } from './useNotificaciones'

/**
 * Lo que corre mientras hay un ciudadano registrado, en cualquier pantalla: los avisos push de su alerta y de sus
 * traslados. Lo único que pinta es la hoja que pregunta si los quiere, que sale una sola vez.
 */
export function Avisos({ ciudadanoId }: { ciudadanoId: number }) {
  const { preguntar, activar, descartar } = useNotificaciones(ciudadanoId)
  return <DialogoActivarAvisos abierto={preguntar} onActivar={activar} onCerrar={descartar} />
}
