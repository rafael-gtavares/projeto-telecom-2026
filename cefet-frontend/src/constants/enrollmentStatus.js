// Fonte única de verdade para situação de matrícula no frontend.
// Espelha cefet-backend/src/constants/status.js — qualquer mudança
// deve ser feita nos dois lados.

export const STATUS = {
  ENROLLED: 'inscrito',
  ACTIVE: 'ativo',
  COMPLETED: 'concluido',
  CANCELED: 'cancelado',
  WAITING_LIST: 'fila_espera',
};
