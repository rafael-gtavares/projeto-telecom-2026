// Situação de um convite enviado a quem ficou na fila de espera de outro curso.
//  - pendente:  aguardando resposta (a vaga fica reservada até expiresAt)
//  - aceito:    aluno aceitou e foi matriculado
//  - recusado:  aluno recusou (vaga liberada)
//  - expirado:  prazo venceu sem resposta (vaga liberada)
//  - cancelado: gestor do curso cancelou o convite (vaga liberada)
const COURSE_INVITATION_STATUS = {
  PENDING: 'pendente',
  ACCEPTED: 'aceito',
  DECLINED: 'recusado',
  EXPIRED: 'expirado',
  CANCELED: 'cancelado',
};

module.exports = { COURSE_INVITATION_STATUS };
