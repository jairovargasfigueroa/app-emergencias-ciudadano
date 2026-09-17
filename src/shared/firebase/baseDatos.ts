import { getApp, getApps, initializeApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'

/** Configuración de la app web del proyecto de Firebase. Se completa en .env.local. */
const configuracion = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

/** Realtime Database. La app solo escucha: el único que escribe es el servidor. */
export function baseDatosFirebase(): Database {
  const app = getApps().length > 0 ? getApp() : initializeApp(configuracion)
  return getDatabase(app)
}
