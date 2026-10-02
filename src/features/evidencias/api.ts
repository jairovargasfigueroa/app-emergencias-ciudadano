import { api } from '@/shared/api/cliente'

import type { Modalidad } from './formatos'

/** `RegistrarEvidenciaRequest` del backend: lo que se sabe del archivo antes de subirlo. Con esto se firma la subida. */
export type RegistrarEvidencia = {
  mimeType: string
  tamanoBytes: number
  /** En hexadecimal, 64 caracteres. */
  sha256: string
}

/**
 * `SubidaEvidenciaResponse` del backend. El archivo se sube con un PUT a `urlSubida`, con el archivo como cuerpo y
 * exactamente estas `cabeceras` (nombres en minúscula); pasado `venceEn` se pide otra URL para la misma evidencia.
 */
export type SubidaEvidencia = {
  evidenciaId: number
  urlSubida: string
  cabeceras: Record<string, string>
  venceEn: string
}

/** `EstadoEvidencia` del backend. */
export type EstadoEvidencia = 'PENDIENTE_SUBIDA' | 'SUBIDA' | 'ANALIZADA' | 'FALLIDA' | 'DESCARTADA'

/** `EvidenciaResponse` del backend. */
export type Evidencia = {
  evidenciaId: number
  alertaId: number
  modalidad: Modalidad
  estado: EstadoEvidencia
}

/*
 * El archivo nunca pasa por el servidor: la app pide dónde subirlo, lo sube directo al almacén y avisa que terminó.
 */
export const evidenciasApi = {
  registrar: (alertaId: number, datos: RegistrarEvidencia) =>
    api.post<SubidaEvidencia>(`/alertas/${alertaId}/evidencias`, datos),

  /** Otra URL para la misma evidencia, si la anterior venció o la subida se cortó. Mientras no esté confirmada. */
  firmarDeNuevo: (evidenciaId: number) => api.post<SubidaEvidencia>(`/evidencias/${evidenciaId}/url-subida`),

  /** El archivo ya está en el almacén. Responde 202 y se puede repetir sin efecto si se cortó la respuesta. */
  confirmar: (evidenciaId: number) => api.post<Evidencia>(`/evidencias/${evidenciaId}/confirmacion`),
}
