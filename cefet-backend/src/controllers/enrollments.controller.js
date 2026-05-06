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

module.exports = { enroll, getMyEnrollments };
