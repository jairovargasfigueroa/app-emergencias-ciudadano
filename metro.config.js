// https://docs.expo.dev/guides/customizing-metro
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// npm dejó varias copias de @tamagui/portal (dentro de tamagui, toast, sheet, dialog...). Cada copia tiene su propio
// contexto, así que ToastViewport y los Sheet no encontraban el PortalProvider de TamaguiProvider. Todas las
// importaciones se resuelven desde el paquete tamagui para usar siempre la misma copia.
const RESOLVER_DESDE_TAMAGUI = path.join(__dirname, 'node_modules', 'tamagui', 'package.json')

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@tamagui/portal' || moduleName.startsWith('@tamagui/portal/')) {
    return context.resolveRequest({ ...context, originModulePath: RESOLVER_DESDE_TAMAGUI }, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
