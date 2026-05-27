const School = require('../models/School');

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// GET /schools/admin — lista todas (ativas e inativas)
const getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: schools });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar escolas', error: error.message });
  }
};

// POST /schools — cria nova escola
const createSchool = async (req, res) => {
  try {
    const { name, city, state } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'O nome da escola é obrigatório' });
    }

    const existing = await School.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Já existe uma escola com esse nome' });
    }

    const school = await School.create({ name, city, state });
    res.status(201).json({ success: true, data: school });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar escola', error: error.message });
  }
};

// PUT /schools/:id — edita escola
const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, state, active } = req.body;

    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'Escola não encontrada' });
    }

    // Verifica duplicidade de nome (ignora a própria escola)
    if (name && name.trim() !== school.name) {
      const duplicate = await School.findOne({ name: name.trim() });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Já existe uma escola com esse nome' });
      }
    }

    const updated = await School.findByIdAndUpdate(
      id,
      { name, city, state, active },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar escola', error: error.message });
  }
};

// DELETE /schools/:id — remove escola
const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'Escola não encontrada' });
    }

    await School.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Escola removida com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover escola', error: error.message });
  }
};

// ─── PÚBLICO (usado no cadastro de usuários) ──────────────────────────────────

// GET /schools — lista apenas escolas ativas (para o select do cadastro)
const getActiveSchools = async (req, res) => {
  try {
    const schools = await School.find({ active: true })
      .select('_id name city state')
      .sort({ name: 1 });

    res.status(200).json({ success: true, data: schools });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar escolas', error: error.message });
  }
};

module.exports = {
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  getActiveSchools,
};