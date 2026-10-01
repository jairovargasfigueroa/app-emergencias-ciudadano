import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * Parte de app.json y agrega, solo si están en el entorno (.env.local), la clave de Google Maps y el archivo de
 * Firebase para Android. Así ninguna credencial se versiona.
 *
 * El archivo de Firebase es obligatorio para compilar Android: el ciudadano entra con su número verificado por SMS
 * (Firebase Authentication) y sin ese archivo la compilación se detiene avisando que falta. Por eso la app ya no abre
 * en Expo Go: necesita un development build. La clave de mapas también hace falta ahí; Expo Go trae la suya.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const configBase = config as ExpoConfig
  const claveGoogleMaps = process.env.GOOGLE_MAPS_API_KEY
  // FCM necesita google-services.json para entregar el token push de los avisos, y Firebase Authentication para
  // mandar el SMS con el código.
  const archivoGoogleServices = process.env.GOOGLE_SERVICES_JSON

  return {
    ...configBase,
    android: {
      ...configBase.android,
      ...(archivoGoogleServices ? { googleServicesFile: archivoGoogleServices } : {}),
    },
    plugins: [
      ...(configBase.plugins ?? []),
      // React Native Firebase: el ingreso con el número verificado por SMS. En iOS pedirían además
      // GoogleService-Info.plist, pero la app solo se compila para Android.
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      ...(claveGoogleMaps ? [['react-native-maps', { androidGoogleMapsApiKey: claveGoogleMaps }] as [string, unknown]] : []),
    ],
  }
}
