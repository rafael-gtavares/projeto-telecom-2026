// Status do certificado de conclusão de um aluno.
//  - em_analise: padrão, aguardando liberação de um gestor
//  - emitido:    liberado
const CERTIFICATE_STATUS = {
  UNDER_REVIEW: 'em_analise',
  ISSUED: 'emitido',
};

module.exports = { CERTIFICATE_STATUS };
