import { hashKey, mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { dejarDeRecibirAvisos, quitarAvisosDeLaBandeja } from '@/features/notificaciones/notificaciones'
import { olvidarSeguimiento, seguimientoKeys } from '@/features/seguimiento/queries'
import { guardarSesion, type Sesion } from '@/shared/sesion/almacen'
import { cerrarSesion, sesionKeys, sesionQuery } from '@/shared/sesion/queries'

import { guardarUltimoNumero, leerUltimoNumero } from './almacen'
import { accesoApi, type Ciudadano, type IngresoCiudadano } from './api'
import { cerrarVerificacion } from './firebase'

export const accesoKeys = {
  ultimoNumero: ['acceso', 'ultimo-numero'] as const,
}

/** Ciudadano con sesión en este teléfono, o `null`: es la sesión guardada, vista desde el acceso. */
export const ciudadanoQuery = () =>
  queryOptions({
    ...sesionQuery<Ciudadano>(),
    select: (sesion) => sesion?.usuario ?? null,
  })

/** El último número con el que se entró en este teléfono, o `null`. Se lee del almacén local. */
export const ultimoNumeroQuery = () =>
  queryOptions({
    queryKey: accesoKeys.ultimoNumero,
    queryFn: leerUltimoNumero,
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: Infinity,
  })

/** El número queda recordado en el teléfono y en la consulta, para que la pantalla de ingreso lo muestre escrito. */
export function recordarUltimoNumero(queryClient: QueryClient, numero: string) {
  queryClient.setQueryData(accesoKeys.ultimoNumero, numero)
  return guardarUltimoNumero(numero)
}

/** Lo que va al servidor, más los 8 dígitos del número que se verificó. */
export type Ingreso = IngresoCiudadano & { numero: string }

/**
 * Entra con el número verificado. La sesión queda guardada con su vencimiento, igual que antes, y al ponerla en la
 * consulta el guard del router cambia solo a las pantallas de adentro.
 */
export const ingresarMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async ({ numero, ...datos }: Ingreso) => {
      const { token, venceEn, ciudadano } = await accesoApi.ingresar(datos)
      const sesion: Sesion<Ciudadano> = { token, venceEn, usuario: ciudadano }
      await guardarSesion(sesion)
      // Si el número no se pudo recordar, la próxima vez se escribe otra vez: no es motivo para no entrar.
      await recordarUltimoNumero(queryClient, numero).catch(() => {})
      return sesion
    },
    // Sin conexión falla enseguida y la pantalla ofrece reintentar. En pausa, un ingreso que la persona ya abandonó,
    // por ejemplo al cambiar el número, podría completarse solo cuando vuelva la señal.
    networkMode: 'always',
    onSuccess: (sesion) => {
      queryClient.setQueryData(sesionKeys.actual, sesion)
    },
  })

/**
 * Cambia el token de la sesión por uno nuevo antes de que venza. Recibe el token que se renueva: si mientras tanto la
 * sesión se cerró o es otra, el token nuevo ya no le corresponde y no se guarda. Un 401 lo atiende el manejador global,
 * que cierra la sesión.
 */
export const renovarSesionMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (_tokenQueSeRenueva: string) => accesoApi.renovar(),
    // Un solo intento por arranque: sin conexión falla enseguida y queda margen para el próximo.
    networkMode: 'always',
    onSuccess: async ({ token, venceEn }, tokenQueSeRenueva) => {
      const actual = queryClient.getQueryData(sesionQuery<Ciudadano>().queryKey)
      if (!actual || actual.token !== tokenQueSeRenueva) {
        return
      }
      const renovada: Sesion<Ciudadano> = { ...actual, token, venceEn }
      await guardarSesion(renovada)
      queryClient.setQueryData(sesionKeys.actual, renovada)
    },
  })

/**
 * Cierra la sesión del ciudadano en este teléfono. Primero, mientras el token todavía sirve, el teléfono deja de recibir
 * los avisos de la cuenta, con un tope de un par de segundos; después se borra la sesión y la app vuelve a la pantalla
 * de ingreso. Al final se borra lo demás que el teléfono guardaba de la cuenta.
 */
export async function cerrarSesionDelCiudadano(queryClient: QueryClient) {
  await dejarDeRecibirAvisos()
  try {
    await cerrarSesion(queryClient)
  } finally {
    // Va después de cerrar la sesión, cuando las pantallas de adentro ya se están cerrando: si se borrara antes, alguna
    // podría volver a pedir sus datos con el token todavía vigente.
    await olvidarLaCuenta(queryClient)
  }
}

/**
 * Borra lo que el teléfono guardaba de la cuenta, porque puede quedar en manos de otra persona: el caso en curso, lo
 * que la caché trajo del servidor, los envíos que esperaban señal, la verificación de Firebase y los avisos de la
 * bandeja. Queda lo que es del teléfono: el último número, para volver a entrar, y si ya se preguntó por los avisos.
 */
export async function olvidarLaCuenta(queryClient: QueryClient) {
  // Un envío que esperaba señal, como una alerta sin conexión, saldría después con la sesión de quien entre.
  queryClient.getMutationCache().clear()
  // De la caché queda el último número, con el que el ingreso aparece ya escrito. La sesión y el caso en curso no se
  // quitan sino que quedan en null: el layout los mira siempre y, sin ellos, los volvería a leer con la pantalla en
  // blanco.
  const quedan = [accesoKeys.ultimoNumero, sesionKeys.actual, seguimientoKeys.enCurso].map((clave) => hashKey(clave))
  queryClient.removeQueries({ predicate: (consulta) => !quedan.includes(consulta.queryHash) })
  await Promise.all([
    // Si el almacén falla, lo demás se borra igual.
    olvidarSeguimiento(queryClient).catch(() => {}),
    cerrarVerificacion(),
    quitarAvisosDeLaBandeja(),
  ])
}
