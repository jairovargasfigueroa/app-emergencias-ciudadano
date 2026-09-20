/**
 * Modo demostración: reemplaza el GPS del teléfono por un punto o un recorrido inventado, para mostrar y probar el
 * flujo completo sin salir a la calle. Solo existe si se compila con `EXPO_PUBLIC_DEMO=1` en `.env.local`; sin esa
 * variable, la app no tiene ni el botón.
 */
export const DEMO = process.env.EXPO_PUBLIC_DEMO === '1'
