const Course = require('../models/Course');

const getCourses = async (req, res, next) => {
  try {
    const { status = 'published', page = 1, limit = 12 } = req.query;
    const filter = {};
    if (req.user?.role === 'aluno' || !req.user) filter.status = 'published';
    else if (status) filter.status = status;

    const courses = await Course.find(filter)
      .populate('professor', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Course.countDocuments(filter);
    res.json({ success: true, data: { courses, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('professor', 'name email');
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

const createCourse = async (req, res, next) => {
  try {
    const { title, description, date, time, professor, maxSlots, status } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const course = await Course.create({
      title, description, date, time,
      professor: professor || req.user.id,
      maxSlots, status, imageUrl,
    });
    await course.populate('professor', 'name email');
    res.status(201).json({ success: true, data: course });
  } catch (err) { next(err); }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    if (req.user.role === 'professor' && course.professor.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Sem permissão para editar este curso' });

    const updates = { ...req.body };
    if (req.file) updates.imageUrl = `/uploads/${req.file.filename}`;

    const updated = await Course.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('professor', 'name email');
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    if (req.user.role === 'professor' && course.professor.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Sem permissão para excluir este curso' });

    await course.deleteOne();
    res.json({ success: true, message: 'Curso excluído com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { getCourses, getCourse, createCourse, updateCourse, deleteCourse };
