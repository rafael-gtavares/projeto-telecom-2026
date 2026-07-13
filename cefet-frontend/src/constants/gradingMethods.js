// Métodos de cálculo da nota final — espelha
// cefet-backend/src/constants/gradingMethods.js
export const GRADING_METHODS = {
  SUM: 'soma',
  SIMPLE: 'media_simples',
  WEIGHTED: 'media_ponderada',
}

export const METHOD_LABELS = {
  [GRADING_METHODS.SUM]: 'Soma dos pontos',
  [GRADING_METHODS.SIMPLE]: 'Média simples',
  [GRADING_METHODS.WEIGHTED]: 'Média ponderada',
}

export const METHOD_HELP = {
  [GRADING_METHODS.SUM]: 'A nota final é a soma dos pontos de todas as avaliações. Cada avaliação vale uma quantidade de pontos.',
  [GRADING_METHODS.SIMPLE]: 'A nota final é a média aritmética das notas (0 a 10) de todas as avaliações.',
  [GRADING_METHODS.WEIGHTED]: 'A nota final é a média ponderada pelos pesos. Notas de 0 a 10, cada avaliação com seu peso.',
}

export const METHOD_OPTIONS = Object.values(GRADING_METHODS).map((value) => ({
  value,
  label: METHOD_LABELS[value],
}))

// Rótulo do "quanto vale" conforme o método
export const passingLabel = (method) =>
  method === GRADING_METHODS.SUM ? 'Pontos para aprovação' : 'Média para aprovação'
