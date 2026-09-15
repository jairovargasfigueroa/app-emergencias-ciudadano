/**
 * Paleta del Sistema de Gestión de Ambulancias. Es la misma en el panel web y en las dos apps: cambiar un color
 * aquí lo cambia en toda la app. Se usa como token de Tamagui, por ejemplo `bg="$primario"`.
 */
export const coloresClaro = {
  primario: '#D92D20',
  primarioPresionado: '#B42318',
  primarioTinte: '#FDECEA',
  primarioTexto: '#FFFFFF',

  fondo: '#F7F7F8',
  superficie: '#FFFFFF',
  borde: '#E7E7EA',
  bordeFuerte: '#D4D4D8',
  texto: '#18181B',
  textoSecundario: '#71717A',
  textoTenue: '#A1A1AA',

  disponible: '#16A34A',
  disponibleTinte: '#E8F5EC',
  disponibleTexto: '#15803D',
  enAtencion: '#D97706',
  enAtencionTinte: '#FDF1E3',
  enAtencionTexto: '#B45309',
  fueraServicio: '#6B7280',
  fueraServicioTinte: '#F0F0F2',
  fueraServicioTexto: '#52525B',

  velo: 'rgba(17, 17, 20, 0.55)',
}

export const coloresOscuro: typeof coloresClaro = {
  ...coloresClaro,
  primarioTinte: '#3A1614',

  fondo: '#111114',
  superficie: '#1A1A1F',
  borde: '#2A2A31',
  bordeFuerte: '#3F3F46',
  texto: '#F4F4F5',
  textoSecundario: '#A1A1AA',
  textoTenue: '#71717A',

  disponibleTinte: '#0F2E1C',
  disponibleTexto: '#4ADE80',
  enAtencionTinte: '#3A2508',
  enAtencionTexto: '#FBBF24',
  fueraServicioTinte: '#27272A',
  fueraServicioTexto: '#A1A1AA',

  velo: 'rgba(0, 0, 0, 0.6)',
}
