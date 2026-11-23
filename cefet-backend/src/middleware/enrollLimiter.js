const rateLimit = require('express-rate-limit');

// Limita tentativas FALHAS de inscrição/solicitação (ex.: código de acesso de
// turma fechada errado), para dificultar adivinhar o código por tentativa.
// A chave é o usuário logado, não o IP: numa escola todos os alunos costumam
// sair pela mesma rede. Deve vir DEPOIS do verifyJWT.
const enrollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `enroll:${req.user.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas de inscrição. Tente novamente em 15 minutos.' },
});

module.exports = enrollLimiter;
