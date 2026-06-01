const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

const enroll = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });
    if (course.status !== 'published')
      return res.status(400).json({ success: false, message: 'Inscrições encerradas para este curso' });
    if (course.availableSlots <= 0)
      return res.status(400).json({ success: false, message: 'Não há vagas disponíveis' });

    const already = await Enrollment.findOne({ user: req.user.id, course: courseId });
    if (already) return res.status(409).json({ success: false, message: 'Você já está inscrito neste curso' });

    const enrollment = await Enrollment.create({ user: req.user.id, course: courseId });
    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

    res.status(201).json({ success: true, data: enrollment });
  } catch (err) { next(err); }
};

const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate({ path: 'course', populate: { path: 'professor', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (err) { next(err); }
};

const checkEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ user: req.user.id, course: req.params.courseId });
    res.json({ success: true, data: { enrolled: !!enrollment, enrollment } });
  } catch (err) { next(err); }
};

const cancelEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOne({ user: req.user.id, course: courseId });
    
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Inscrição não encontrada' });
    }
    
    if (enrollment.status === 'concluido') {
      return res.status(400).json({ success: false, message: 'Não é possível cancelar um curso já concluído' });
    }
    
    await enrollment.deleteOne();
    await Course.findOneAndUpdate(
      { _id: courseId, enrolledCount: { $gt: 0 } },
      { $inc: { enrolledCount: -1 } }
    );
    
    res.json({ success: true, message: 'Inscrição cancelada com sucesso' });
  } catch (err) { next(err); }
};

// GET /courses/:courseId/students — lista alunos inscritos (professor/admin)
const getCourseStudents = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({
      course: req.params.courseId,
      status: { $ne: 'cancelado' },
    })
      .populate('user', 'name email avatar school schoolLevel birthDate')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: enrollments });
  } catch (err) { next(err); }
};

module.exports = { enroll, getMyEnrollments, checkEnrollment, cancelEnrollment, getCourseStudents };
