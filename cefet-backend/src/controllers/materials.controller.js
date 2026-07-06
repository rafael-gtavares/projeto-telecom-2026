const Material = require('../models/Material');
const { notifyNewMaterial, removeNotificationsByRef } = require('../services/notify');

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
    console.log(req.body)
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

    // Notifica os alunos inscritos (best-effort — não bloqueia a resposta)
    await notifyNewMaterial({ course: req.params.courseId, material, createdBy: req.user.id });

    res.status(201).json({ success: true, data: material });
  } catch (err) { next(err); }
};

// PUT /courses/:courseId/materials/:materialId
const updateMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOne({ _id: req.params.materialId, course: req.params.courseId });
    if (!material) return res.status(404).json({ success: false, message: 'Material não encontrado' });

    // Whitelist de campos editáveis — nunca permite alterar course/createdBy via body
    const ALLOWED_FIELDS = ['title', 'description', 'type', 'content', 'lesson', 'order'];
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) material[field] = req.body[field];
    }
    await material.save();
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
};

// DELETE /courses/:courseId/materials/:materialId
const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOneAndDelete({ _id: req.params.materialId, course: req.params.courseId });
    if (!material) return res.status(404).json({ success: false, message: 'Material não encontrado' });

    // Remove as notificações geradas por este material (best-effort)
    removeNotificationsByRef(material._id);

    res.json({ success: true, message: 'Material excluído com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { getMaterials, createMaterial, updateMaterial, deleteMaterial };
