const User = require('../models/User');

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('school', 'name city');
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true, data: user.toPublic() });
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const { name, birthDate, gender, schoolLevel, incomeRange, password, school } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    if (name) user.name = name;
    if (birthDate) user.birthDate = birthDate;
    if (gender) user.gender = gender;
    if (schoolLevel !== undefined) user.schoolLevel = schoolLevel;
    if (incomeRange) user.incomeRange = incomeRange;
    if (password) user.password = password;
    if (school !== undefined) user.school = school || null;

    await user.save();

    // Popula escola para retornar dados completos
    await user.populate('school', 'name city');
    res.json({ success: true, data: user.toPublic() });
  } catch (err) { next(err); }
};

const getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) filter.role = role;

    const users = await User.find(filter, '-password')
      .populate('school', 'name city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: { users, total } });
  } catch (err) { next(err); }
};

const getUsersBase = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) filter.role = role;

    const users = await User.find(
      { role: { $in: ['admin', 'professor'] } },
      '_id name email role'
    )
    const total = await User.countDocuments({ role: { $in: ['admin', 'professor'] } });
    res.json({ success: true, data: { users, total } });
  } catch (err) { next(err); }
}

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['aluno', 'professor'].includes(role))
      return res.status(400).json({ success: false, message: 'Role inválido. Use aluno ou professor' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    if (target.role === 'admin')
      return res.status(403).json({ success: false, message: 'Não é possível alterar o role de um admin' });

    target.role = role;
    await target.save();
    res.json({ success: true, data: target.toPublic() });
  } catch (err) { next(err); }
};

module.exports = { getMe, updateMe, getUsers, getUsersBase, updateUserRole };
