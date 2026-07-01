const User = require('../models/User');
const escapeRegex = require('../helpers/escapeRegex');
const { ROLES } = require('../constants/roles');

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

const getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1 } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = {};
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [{ name: new RegExp(safe, 'i') }, { email: new RegExp(safe, 'i') }];
    }
    if (role) filter.role = role;

    const users = await User.find(filter, '-password')
      .populate('school', 'name city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: { users, total } });
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

module.exports = { getMe, updateMe, getUsers, getUsersBase, updateUserRole };
