const School = require('../models/School');
const User = require('../models/User');

// GET /schools — lista todas as escolas ativas (público: usado no cadastro e perfil)
const getSchools = async (req, res, next) => {
  try {
    const schools = await School.find({ active: true })
      .select('_id name city')
      .sort({ name: 1 });
    res.json({ success: true, data: schools });
  } catch (err) { next(err); }
};

// GET /schools/all — lista todas incluindo inativas (admin only)
const getAllSchools = async (req, res, next) => {
  try {
    const schools = await School.find()
      .sort({ name: 1 });
    res.json({ success: true, data: schools });
  } catch (err) { next(err); }
};

// POST /schools — cria escola (admin only)
const createSchool = async (req, res, next) => {
  try {
    const { name, city } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Nome da escola é obrigatório' });

    // Verifica duplicata (case insensitive)
    const exists = await School.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      city: city?.trim() || '',
    });
    if (exists)
      return res.status(409).json({ success: false, message: 'Já existe uma escola com este nome e cidade' });

    const school = await School.create({ name: name.trim(), city: city?.trim() || '' });
    res.status(201).json({ success: true, data: school });
  } catch (err) { next(err); }
};

// PUT /schools/:id — edita escola (admin only)
const updateSchool = async (req, res, next) => {
  try {
    const { name, city, active } = req.body;
    const school = await School.findById(req.params.id);
    if (!school)
      return res.status(404).json({ success: false, message: 'Escola não encontrada' });

    if (name !== undefined) school.name = name.trim();
    if (city !== undefined) school.city = city.trim();
    if (active !== undefined) school.active = active;

    await school.save();
    res.json({ success: true, data: school });
  } catch (err) { next(err); }
};

// DELETE /schools/:id — remove escola (admin only)
// Segurança: não permite deletar escola que está sendo usada por alunos
const deleteSchool = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school)
      return res.status(404).json({ success: false, message: 'Escola não encontrada' });

    // Verifica se algum usuário está vinculado a esta escola
    const usersCount = await User.countDocuments({ school: req.params.id });
    if (usersCount > 0)
      return res.status(400).json({
        success: false,
        message: `Não é possível excluir. ${usersCount} usuário(s) estão vinculados a esta escola. Desative-a em vez de excluir.`,
      });

    await school.deleteOne();
    res.json({ success: true, message: 'Escola excluída com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { getSchools, getAllSchools, createSchool, updateSchool, deleteSchool };
