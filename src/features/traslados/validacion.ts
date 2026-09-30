import { z } from 'zod'

import { ErrorApi, mensajeDeError } from '@/shared/api/cliente'

/**
 * Los máximos que valida el backend en `RegistrarTrasladoRequest` y `DetallesTrasladoRequest`: es mejor frenar acá
 * que rebotar el pedido ya escrito.
 */
export const LIMITES = {
  origenReferencia: 255,
  contactoNombre: 255,
  contactoTelefono: 30,
  destinoDetalle: 255,
  observaciones: 2000,
} as const

/**
 * Lo que se escribe a mano al pedir, tal como está en los campos. Son las reglas del backend, pero con el mensaje
 * debajo del campo que hay que corregir en vez de un "Hay campos inválidos" que no dice cuál.
 */
export const esquemaDelPedido = z
  .object({
    origenReferencia: z
      .string()
      .trim()
      .max(LIMITES.origenReferencia, `La referencia puede tener hasta ${LIMITES.origenReferencia} caracteres.`),
    destinoDetalle: z
      .string()
      .trim()
      .max(LIMITES.destinoDetalle, `El área puede tener hasta ${LIMITES.destinoDetalle} caracteres.`),
    contactoNombre: z
      .string()
      .trim()
      .max(LIMITES.contactoNombre, `El nombre puede tener hasta ${LIMITES.contactoNombre} caracteres.`),
    contactoTelefono: z
      .string()
      .trim()
      .max(LIMITES.contactoTelefono, `El teléfono puede tener hasta ${LIMITES.contactoTelefono} caracteres.`),
    pesoAproximado: z
      .string()
      .trim()
      .refine(
        (peso) => peso === '' || (/^\d+$/.test(peso) && Number(peso) > 0),
        'Pon el peso en kilos enteros, por ejemplo 70.',
      ),
    acompanantes: z.string().trim().regex(/^\d*$/, 'Pon cuántas personas lo acompañan, por ejemplo 1.'),
    observaciones: z
      .string()
      .trim()
      .max(LIMITES.observaciones, `Las observaciones pueden tener hasta ${LIMITES.observaciones} caracteres.`),
  })
  // El servidor exige el contacto entero o ninguno: el error va con el teléfono, que es lo último del bloque.
  .refine((pedido) => Boolean(pedido.contactoNombre) === Boolean(pedido.contactoTelefono), {
    message: 'Pon el nombre y el teléfono, o deja los dos vacíos.',
    path: ['contactoTelefono'],
  })

export type CampoEscrito = keyof z.input<typeof esquemaDelPedido>

/** El primer mensaje de cada campo, para ponerlo debajo de él. */
export function erroresPorCampo(error: z.ZodError): Partial<Record<CampoEscrito, string>> {
  const errores: Partial<Record<CampoEscrito, string>> = {}
  for (const problema of error.issues) {
    const campo = problema.path[0] as CampoEscrito
    errores[campo] ??= problema.message
  }
  return errores
}

/**
 * Si igual el servidor rechaza un campo —porque sus reglas cambiaron y las de acá no—, se dice qué campo y por qué,
 * no el "Hay campos inválidos" general.
 */
export function mensajeDelRechazo(error: unknown) {
  if (error instanceof ErrorApi && error.cuerpo.errores?.length) {
    return error.cuerpo.errores.map((campo) => campo.mensaje).join(' ')
  }
  return mensajeDeError(error)
}
