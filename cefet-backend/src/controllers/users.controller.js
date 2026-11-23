const User = require('../models/User');
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const escapeRegex = require('../helpers/escapeRegex');
const { ROLES } = require('../constants/roles');
const { SIGNATURE_FONTS } = require('../constants/signatureFonts');

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('school', 'name city');
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true, data: user.toPublic() });
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const { name, birthDate, gender, schoolLevel, incomeRange, password, currentPassword, school } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    if (name) user.name = name;
    if (birthDate) user.birthDate = birthDate;
    if (gender) user.gender = gender;
    if (schoolLevel !== undefined) user.schoolLevel = schoolLevel;
    if (incomeRange) user.incomeRange = incomeRange;

    // Troca de senha exige a senha atual (evita sequestro de conta via token roubado)
    if (password) {
      if (!currentPassword)
        return res.status(400).json({ success: false, message: 'Informe a senha atual para alterá-la' });
      const ok = await user.comparePassword(currentPassword);
      if (!ok)
        return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
      user.password = password;
    }

    if (school !== undefined) user.school = school || null;

    await user.save();

    // Popula escola para retornar dados completos
    await user.populate('school', 'name city');
    res.json({ success: true, data: user.toPublic() });
  } catch (err) { next(err); }
};

// PUT /users/me/signature — professor/admin define (ou limpa) sua assinatura.
// body: { text, font } → salva; { text: '' } ou { text: null } → volta ao padrão
// (o próprio nome, na fonte padrão — ver helpers/signatureHelper.js).
const updateMySignature = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    const { text, font } = req.body;

    // Texto vazio/nulo → limpa a assinatura salva (passa a valer a assinatura padrão)
    if (text === '' || text === null || text === undefined) {
      user.signature = { text: null, font: null };
      await user.save();
      return res.json({ success: true, data: user.toPublic() });
    }

    const trimmed = String(text).trim();
    if (!trimmed)
      return res.status(400).json({ success: false, message: 'Informe o texto da assinatura' });
    if (trimmed.length > 60)
      return res.status(400).json({ success: false, message: 'A assinatura deve ter no máximo 60 caracteres' });
    if (!Object.values(SIGNATURE_FONTS).includes(font))
      return res.status(400).json({ success: false, message: 'Fonte de assinatura inválida' });

    user.signature = { text: trimmed, font };
    await user.save();
    res.json({ success: true, data: user.toPublic() });
  } catch (err) { next(err); }
};

const getUsers = async (req, res, next) => {
  try {
    const { search, role, school, course, page = 1 } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = {};
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [{ name: new RegExp(safe, 'i') }, { email: new RegExp(safe, 'i') }];
    }
    if (role) filter.role = role;
    if (school) filter.school = school === '__none__' ? null : school;

    // Filtro por curso: só quem possui matrícula (qualquer registro) no curso.
    // Combina por AND com busca/cargo/escola — cada filtro restringe o mesmo `filter`.
    if (course) {
      if (typeof course !== 'string' || !mongoose.isValidObjectId(course))
        return res.status(400).json({ success: false, message: 'Curso inválido' });
      filter._id = { $in: await Enrollment.distinct('user', { course }) };
    }

    // Ordem alfabética pelo nome completo. A collation 'pt' (strength 1) ignora
    // maiúsculas/minúsculas e acentos ("Álvaro" fica junto de "Alvaro"); o _id
    // desempata para a paginação ser estável.
    const users = await User.find(filter, '-password')
      .populate('school', 'name city')
      .sort({ name: 1, _id: 1 })
      .collation({ locale: 'pt', strength: 1 })
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: { users, total } });
  } catch (err) { next(err); }
};

// Validação do nome: texto, sem espaços sobrando, só letras (com acento),
// espaço, apóstrofo, hífen e ponto. Retorna { value } ou { error }.
const NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;
const parseName = (raw) => {
  if (typeof raw !== 'string') return { error: 'Informe o nome completo' };
  const value = raw.replace(/\s+/g, ' ').trim();
  if (value.length < 3) return { error: 'O nome deve ter pelo menos 3 caracteres' };
  if (value.length > 120) return { error: 'O nome deve ter no máximo 120 caracteres' };
  if (!NAME_REGEX.test(value)) return { error: 'O nome contém caracteres inválidos' };
  return { value };
};

// Validação da data de nascimento: 'YYYY-MM-DD' real (rejeita 2026-02-31),
// entre 1900 e hoje. Gravada à meia-noite UTC — igual ao cadastro (new Date('YYYY-MM-DD')).
const parseBirthDate = (raw) => {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw))
    return { error: 'Data de nascimento inválida' };
  const value = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== raw)
    return { error: 'Data de nascimento inválida' };
  if (value > new Date() || value < new Date('1900-01-01T00:00:00.000Z'))
    return { error: 'Data de nascimento fora do intervalo permitido' };
  return { value };
};

// PUT /users/:id/personal-info — admin corrige nome e data de nascimento.
// Whitelist estrita: só `name` e `birthDate` são lidos do body; qualquer outro
// campo (role, email, senha, escola...) é ignorado.
const updateUserPersonalInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: 'Usuário inválido' });

    const target = await User.findById(id).select('role');
    if (!target)
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    // Mesma proteção do cargo: admin comum não altera superadministrador
    if (req.user.role === ROLES.ADMIN && target.role === ROLES.SUPERADMIN)
      return res.status(403).json({ success: false, message: 'Você não pode alterar um superadministrador.' });

    const name = parseName(req.body.name);
    if (name.error) return res.status(400).json({ success: false, message: name.error });

    const update = { name: name.value };

    // Data opcional no body (usuários antigos podem não ter): ausente = não altera
    if (req.body.birthDate !== undefined && req.body.birthDate !== null && req.body.birthDate !== '') {
      const birth = parseBirthDate(req.body.birthDate);
      if (birth.error) return res.status(400).json({ success: false, message: birth.error });
      update.birthDate = birth.value;
    }

    // $set + runValidators valida só estes campos (um save() revalidaria o
    // documento todo e poderia falhar em cadastros antigos incompletos).
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate('school', 'name city');

    res.json({ success: true, data: updated.toPublic() });
  } catch (err) { next(err); }
};

// Lista enxuta de admins/professores (usada em seletores) — sem filtros/paginação
const getUsersBase = async (req, res, next) => {
  try {
    const roleFilter = { role: { $in: ['admin', 'professor'] } };
    const users = await User.find(roleFilter, '_id name email role');
    const total = await User.countDocuments(roleFilter);
    res.json({ success: true, data: { users, total } });
  } catch (err) { next(err); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Define quais cargos cada tipo de usuário pode atribuir
    const allowedRoles = {
      [ROLES.ADMIN]: [
        ROLES.STUDENT,
        ROLES.PROFESSOR,
      ],
      [ROLES.SUPERADMIN]: [
        ROLES.STUDENT,
        ROLES.PROFESSOR,
        ROLES.ADMIN,
      ],
    };

    // Verifica se o usuário autenticado pode atribuir o cargo solicitado
    if (!allowedRoles[req.user.role]?.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para atribuir esse cargo.',
      });
    }

    const target = await User.findById(req.params.id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Admin comum não pode alterar contas de superadministradores
    if (
      req.user.role === ROLES.ADMIN &&
      target.role === ROLES.SUPERADMIN
    ) {
      return res.status(403).json({
        success: false,
        message: 'Você não pode alterar um superadministrador.',
      });
    }

    // O cargo de superadministrador é protegido e não pode ser alterado
    if (target.role === ROLES.SUPERADMIN) {
      return res.status(403).json({
        success: false,
        message: 'O cargo de superadministrador não pode ser alterado.',
      });
    }

    // Atualiza o cargo do usuário
    target.role = role;

    // Atualiza a permissão de edição de dados
    target.canEditPersonalInfo = role !== ROLES.STUDENT;

    await target.save();

    res.json({
      success: true,
      data: target.toPublic(),
    });
  } catch (err) {
    next(err);
  }
};

const updateEditPermission = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.params.id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.',
      });
    }

    if (currentUser.role !== ROLES.STUDENT) {
      return res.status(400).json({
        success: false,
        message: 'Essa permissão só pode ser alterada para alunos.',
      });
    }

    currentUser.canEditPersonalInfo = req.body.canEditPersonalInfo;

    await currentUser.save();

    res.json({
      success: true,
      data: currentUser.toPublic(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe, updateMySignature, getUsers, getUsersBase, updateUserRole, updateEditPermission, updateUserPersonalInfo };
