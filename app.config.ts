import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * Parte de app.json y agrega la clave de Google Maps solo si está en el entorno (.env.local), para no versionarla.
 * Android la necesita en un development build; Expo Go trae la suya.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const claveGoogleMaps = process.env.GOOGLE_MAPS_API_KEY
  const configBase = config as ExpoConfig
  if (!claveGoogleMaps) {
    return configBase
  }
  return {
    ...configBase,
    plugins: [...(configBase.plugins ?? []), ['react-native-maps', { androidGoogleMapsApiKey: claveGoogleMaps }]],
  }
}
