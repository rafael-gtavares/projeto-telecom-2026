// Métodos de cálculo da nota final de um curso. O admin escolhe um por curso.
//  - soma:            nota final = soma dos pontos de cada avaliação
//  - media_simples:   nota final = média aritmética das notas (0–10)
//  - media_ponderada: nota final = média ponderada pelas pesos das avaliações
const GRADING_METHODS = {
  SUM: 'soma',
  SIMPLE: 'media_simples',
  WEIGHTED: 'media_ponderada',
};

// Configuração padrão quando o curso ainda não tem um sistema de avaliações montado.
const DEFAULT_CONFIG = {
  method: GRADING_METHODS.WEIGHTED,
  passingGrade: 6,
};

module.exports = { GRADING_METHODS, DEFAULT_CONFIG };
