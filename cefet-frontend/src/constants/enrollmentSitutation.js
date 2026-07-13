// Fonte única de verdade para situação de matrícula no frontend.
// Espelha cefet-backend/src/constants/enrollmentSituation.js — os VALORES
// precisam bater com o enum do backend (senão o save falha na validação).
// PENDENTE = 'nao_lancado' é o estado "Em andamento" (curso ainda rolando).

export const SITUATIONS = {
  PENDENTE: 'nao_lancado',
  APROVADO: 'aprovado',
  REPROVADO: 'reprovado',
  DESISTENTE: 'desistente',
}

// Labels exibidos na UI (selects, badges, etc.)
export const SITUATION_LABELS = {
  [SITUATIONS.PENDENTE]: 'Em andamento',
  [SITUATIONS.APROVADO]: 'Aprovado',
  [SITUATIONS.REPROVADO]: 'Reprovado',
  [SITUATIONS.DESISTENTE]: 'Desistente',
}

// Usado para montar o <select> na ordem correta
export const SITUATION_OPTIONS = Object.values(SITUATIONS).map(value => ({
  value,
  label: SITUATION_LABELS[value],
}))