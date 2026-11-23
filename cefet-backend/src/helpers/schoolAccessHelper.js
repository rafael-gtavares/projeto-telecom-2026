const crypto = require('crypto');
const mongoose = require('mongoose');
const School = require('../models/School');
const User = require('../models/User');

// Turma fechada para escola(s): só entra quem tem uma dessas escolas no perfil
// E informa o código de acesso definido pelo gestor do curso.

// Sem 0/O/1/I: o código costuma ser ditado ou escrito no quadro em sala
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_REGEX = /^[A-Z0-9-]{4,20}$/;

const httpError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const generateAccessCode = () =>
  Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');

// Maiúsculas/minúsculas e espaços não importam na digitação
const normalizeAccessCode = (v) => String(v ?? '').replace(/\s+/g, '').toUpperCase();

const isRestricted = (course) => (course?.restrictedSchools || []).length > 0;

// Normaliza os campos de turma fechada vindos do formulário.
//  - sem escolas: curso aberto (limpa o código)
//  - com escolas: valida escolas; código informado ou, se vazio, mantém o atual/gera um novo
const resolveRestriction = async ({ restrictedSchools, accessCode }, currentCode = null) => {
  const ids = [...new Set((Array.isArray(restrictedSchools) ? restrictedSchools : [])
    .map((s) => String(s?._id || s))
    .filter(Boolean))];

  if (!ids.length) return { restrictedSchools: [], accessCode: null };

  if (!ids.every((id) => mongoose.isValidObjectId(id)))
    throw httpError('Lista de escolas inválida.');

  const found = await School.countDocuments({ _id: { $in: ids }, active: true });
  if (found !== ids.length)
    throw httpError('Uma ou mais escolas selecionadas não existem ou estão inativas.');

  let code = normalizeAccessCode(accessCode);
  if (!code) code = currentCode || generateAccessCode();
  if (!CODE_REGEX.test(code))
    throw httpError('O código de acesso deve ter de 4 a 20 caracteres (letras, números ou hífen).');

  return { restrictedSchools: ids, accessCode: code };
};

// Verifica se o usuário pode entrar na turma. Retorna null (liberado) ou
// { status, code, message } para o controller responder.
// `course` precisa ter sido buscado com .select('+accessCode').
const checkSchoolAccess = async ({ course, userId, userRole, accessCode }) => {
  if (!isRestricted(course)) return null;
  if (course.hasManageAccess?.(userId, userRole)) return null;

  const [user, schools] = await Promise.all([
    User.findById(userId).select('school').lean(),
    School.find({ _id: { $in: course.restrictedSchools } }).select('name').lean(),
  ]);

  const allowed = course.restrictedSchools.map((s) => String(s?._id || s));
  if (!user?.school || !allowed.includes(String(user.school))) {
    const names = schools.map((s) => s.name).join(', ');
    return {
      status: 403,
      code: 'SCHOOL_RESTRICTED',
      message: `Esta turma é exclusiva para alunos de: ${names}. Se essa é a sua escola, atualize-a em "Meu perfil".`,
    };
  }

  const typed = normalizeAccessCode(accessCode);
  if (!typed) {
    return { status: 403, code: 'ACCESS_CODE_REQUIRED', message: 'Informe o código de acesso da turma.' };
  }

  const expected = normalizeAccessCode(course.accessCode);
  const ok = expected.length === typed.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(typed));
  if (!ok) {
    return { status: 403, code: 'INVALID_ACCESS_CODE', message: 'Código de acesso incorreto. Confira com o professor.' };
  }

  return null;
};

const sendAccessError = (res, denied) =>
  res.status(denied.status).json({ success: false, code: denied.code, message: denied.message });

module.exports = {
  generateAccessCode,
  normalizeAccessCode,
  isRestricted,
  resolveRestriction,
  checkSchoolAccess,
  sendAccessError,
};
