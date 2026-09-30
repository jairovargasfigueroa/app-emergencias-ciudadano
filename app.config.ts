import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * Parte de app.json y agrega, solo si están en el entorno (.env.local), la clave de Google Maps y el archivo de
 * Firebase para Android. Así ninguna credencial se versiona. Las dos hacen falta en un development build; Expo Go trae
 * su propia clave de mapas y no recibe push en Android.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const configBase = config as ExpoConfig
  const claveGoogleMaps = process.env.GOOGLE_MAPS_API_KEY
  // FCM en Android necesita google-services.json para entregar el token push de los avisos.
  const archivoGoogleServices = process.env.GOOGLE_SERVICES_JSON

  return {
    ...configBase,
    android: {
      ...configBase.android,
      ...(archivoGoogleServices ? { googleServicesFile: archivoGoogleServices } : {}),
    },
    plugins: [
      ...(configBase.plugins ?? []),
      ...(claveGoogleMaps ? [['react-native-maps', { androidGoogleMapsApiKey: claveGoogleMaps }] as [string, unknown]] : []),
    ],
  }
}
