const { ROLES } = require('../constants/roles');
const User = require('../models/User');

// Normaliza uma data para 'YYYY-MM-DD' (compara nascimento sem hora/fuso)
const toDay = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? String(d) : x.toISOString().slice(0, 10);
};

// Alunos só podem alterar nome e data de nascimento se tiverem a permissão
// `canEditPersonalInfo`. Admin e professores sempre podem.
const verifyEditPermission = async (req, res, next) => {
  try {
    // Admin/professor (qualquer papel que não seja aluno) podem editar os campos
    if (req.user.role !== ROLES.STUDENT) return next();

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Só é "edição sensível" quando o valor de fato MUDA (e seria gravado pelo
    // updateMe, que só aplica valores truthy). A tela de perfil envia o formulário
    // inteiro ao salvar — mandar o mesmo nome/nascimento não deve bloquear a
    // alteração dos demais campos (sexo, escolaridade, renda, senha...).
    const nameChanging = !!req.body.name && req.body.name !== currentUser.name;
    const birthChanging =
      !!req.body.birthDate && toDay(req.body.birthDate) !== toDay(currentUser.birthDate);

    if (!nameChanging && !birthChanging) return next();

    if (currentUser.canEditPersonalInfo) return next();

    return res.status(403).json({
      message: 'Você não possui permissão para alterar esses dados.'
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
    verifyEditPermission
};
