import NetInfo from '@react-native-community/netinfo'
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppState, Platform, type AppStateStatus } from 'react-native'

import { ErrorApi } from '@/shared/api/cliente'

// TanStack Query pausa y reanuda las peticiones según la conexión del teléfono.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((estado) => {
    setOnline(estado.isConnected !== false)
  }),
)

/** Un 4xx es una respuesta definitiva del backend: reintentarla no cambia nada. */
function esErrorDefinitivo(error: unknown) {
  return error instanceof ErrorApi && error.status >= 400 && error.status < 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: (fallos, error) => !esErrorDefinitivo(error) && fallos < 2,
    },
  },
})

function alCambiarEstadoApp(estado: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(estado === 'active')
  }
}

/** Refresca las consultas al volver a la app, como hace el navegador al recuperar el foco. */
export function useFocoDeLaApp() {
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', alCambiarEstadoApp)
    return () => suscripcion.remove()
  }, [])
}
