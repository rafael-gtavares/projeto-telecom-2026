// Situação de publicação de um curso.
//  - draft:        rascunho (não visível ao público)
//  - published:    publicado, aceitando inscrições
//  - em_andamento: em execução
//  - closed:       encerrado
const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  IN_PROGRESS: 'em_andamento',
  CLOSED: 'closed',
};

module.exports = { COURSE_STATUS };
