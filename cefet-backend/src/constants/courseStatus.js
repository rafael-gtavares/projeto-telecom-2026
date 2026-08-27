// Situação de publicação de um curso.
//  - draft:            rascunho (não visível ao público)
//  - published:        publicado, aceitando inscrições
//  - vagas_encerradas: publicado, visível, mas sem novas inscrições/solicitações
//                       (fechado manualmente pelo professor/admin, independe de
//                       vagas disponíveis ou data de início)
//  - em_andamento:     em execução
//  - closed:           encerrado
const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  VACANCIES_CLOSED: 'vagas_encerradas',
  IN_PROGRESS: 'em_andamento',
  CLOSED: 'closed',
};

module.exports = { COURSE_STATUS };