const Material = require('../models/Material');

// GET /courses/:courseId/materials
const getMaterials = async (req, res, next) => {
  try {
    const materials = await Material.find({ course: req.params.courseId })
      .sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: materials });
  } catch (err) { next(err); }
};

// POST /courses/:courseId/materials
const createMaterial = async (req, res, next) => {
  try {
    const { title, description, type, content, lesson, order } = req.body;
    if (!title || !type)
      return res.status(400).json({ success: false, message: 'Título e tipo são obrigatórios' });

    const material = await Material.create({
      course: req.params.courseId,
      lesson: lesson || null,
      title, description, type,
      content: content || '',
      order: order || 0,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: material });
  } catch (err) { next(err); }
};

// PUT /courses/:courseId/materials/:materialId
const updateMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOne({ _id: req.params.materialId, course: req.params.courseId });
    if (!material) return res.status(404).json({ success: false, message: 'Material não encontrado' });

    Object.assign(material, req.body);
    await material.save();
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
};

// DELETE /courses/:courseId/materials/:materialId
const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOneAndDelete({ _id: req.params.materialId, course: req.params.courseId });
    if (!material) return res.status(404).json({ success: false, message: 'Material não encontrado' });
    res.json({ success: true, message: 'Material excluído com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { getMaterials, createMaterial, updateMaterial, deleteMaterial };
