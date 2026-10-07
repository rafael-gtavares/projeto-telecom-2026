// Espelham a lógica do backend (services/certificate.js + certificate.controller.js)
// para a prévia visual do certificado no front.

import { SIGNATURE_FONTS, DEFAULT_SIGNATURE_FONT } from '../constants/signatureFonts'

const timeToMinutes = (t) => {
  const [h, m] = String(t || '').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Carga horária = soma da duração das aulas → "20h", "20h30" ou "—"
export const certificateWorkloadLabel = (lessons = []) => {
  const total = lessons.reduce(
    (sum, l) => sum + Math.max(0, timeToMinutes(l.endTime) - timeToMinutes(l.startTime)),
    0
  )
  if (!total) return '—'
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

// Código de validação estável a partir do id da inscrição
export const certificateId = (enrollmentId) =>
  `CEFET-${String(enrollmentId || '').slice(-8).toUpperCase()}`

// Assinatura padrão: espelha helpers/signatureHelper.js do backend. Sempre
// devolve uma assinatura válida — texto salvo no perfil ou o próprio nome, e a
// fonte do curso (override) → a do perfil → a fonte padrão.
export const resolveSignature = (person, fontOverride = null) => {
  const fonts = SIGNATURE_FONTS.map((f) => f.value)
  const name = person?.name || ''
  const text = (person?.signature?.text || '').trim() || name.trim()
  const font = [fontOverride, person?.signature?.font].find((f) => fonts.includes(f)) || DEFAULT_SIGNATURE_FONT
  return { name, text: text.slice(0, 60), font }
}
