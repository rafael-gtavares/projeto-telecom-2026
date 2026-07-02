// Fonte única de verdade para situação de matrícula no frontend.
// Espelha cefet-backend/src/constants/situation.js — qualquer mudança
// deve ser feita nos dois lados.

export const SITUATIONS = {
  PENDENTE: 'pendente',
  APROVADO: 'aprovado',
  REPROVADO: 'reprovado',
  DESISTENTE: 'desistente',
}

// Labels exibidos na UI (selects, badges, etc.)
export const SITUATION_LABELS = {
  [SITUATIONS.PENDENTE]: 'Ainda não lançada',
  [SITUATIONS.APROVADO]: 'Aprovado',
  [SITUATIONS.REPROVADO]: 'Reprovado',
  [SITUATIONS.DESISTENTE]: 'Desistente',
}

// Usado para montar o <select> na ordem correta
export const SITUATION_OPTIONS = Object.values(SITUATIONS).map(value => ({
  value,
  label: SITUATION_LABELS[value],
}))