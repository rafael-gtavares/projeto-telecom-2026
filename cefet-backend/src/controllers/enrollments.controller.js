const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');

// POST /enrollments
const enroll = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado' });
    if (course.status !== 'published')
      return res.status(400).json({ success: false, message: 'Inscrições encerradas para este curso' });

    // 1) Cria a inscrição primeiro — o índice único (user, course) impede duplicidade
    let enrollment;
    try {
      enrollment = await Enrollment.create({ user: req.user.id, course: courseId });
    } catch (e) {
      if (e.code === 11000)
        return res.status(409).json({ success: false, message: 'Você já está inscrito neste curso' });
      throw e;
    }

    // 2) Tenta ocupar uma vaga de forma atômica (só incrementa se ainda houver vaga)
    const updated = await Course.findOneAndUpdate(
      { _id: courseId, $expr: { $lt: ['$enrolledCount', '$maxSlots'] } },
      { $inc: { enrolledCount: 1 } },
      { new: true }
    );

    // 3a) Conseguiu vaga → inscrição confirmada
    if (updated) {
      return res.status(201).json({
        success: true,
        data: enrollment,
        waitlisted: false,
        enrolledCount: updated.enrolledCount,
      });
    }

    // 3b) Sem vaga → entra na fila de espera (não apaga a inscrição)
    enrollment.status = ENROLLMENT_STATUS.WAITING_LIST;
    await enrollment.save();
    const waitlistPosition = await Enrollment.countDocuments({
      course: courseId,
      status: ENROLLMENT_STATUS.WAITING_LIST,
      createdAt: { $lte: enrollment.createdAt },
    });

    return res.status(201).json({
      success: true,
      data: enrollment,
      waitlisted: true,
      waitlistPosition,
      enrolledCount: course.enrolledCount,
    });
  } catch (err) { next(err); }
};

const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate({ path: 'course', populate: { path: 'professor', select: 'name' } })
      .sort({ createdAt: -1 });

    // Anexa a posição na fila para inscrições em fila_espera
    const data = await Promise.all(enrollments.map(async (e) => {
      const obj = e.toObject();
      if (e.status === ENROLLMENT_STATUS.WAITING_LIST && e.course) {
        obj.waitlistPosition = await Enrollment.countDocuments({
          course: e.course._id,
          status: ENROLLMENT_STATUS.WAITING_LIST,
          createdAt: { $lte: e.createdAt },
        });
      }
      return obj;
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const checkEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ user: req.user.id, course: req.params.courseId });
    const waitlisted = enrollment?.status === ENROLLMENT_STATUS.WAITING_LIST;

    let waitlistPosition = null;
    if (waitlisted) {
      waitlistPosition = await Enrollment.countDocuments({
        course: req.params.courseId,
        status: ENROLLMENT_STATUS.WAITING_LIST,
        createdAt: { $lte: enrollment.createdAt },
      });
    }

    res.json({
      success: true,
      data: {
        enrolled: !!enrollment && !waitlisted,
        waitlisted,
        waitlistPosition,
        enrollment,
      },
    });
  } catch (err) { next(err); }
};

const cancelEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOne({ user: req.user.id, course: courseId });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Inscrição não encontrada' });
    }

    if (enrollment.status === ENROLLMENT_STATUS.COMPLETED) {
      return res.status(400).json({ success: false, message: 'Não é possível cancelar um curso já concluído' });
    }

    const wasWaitlisted = enrollment.status === ENROLLMENT_STATUS.WAITING_LIST;
    await enrollment.deleteOne();

    let promoted = false;
    let course = await Course.findById(courseId);

    // Quem estava na fila apenas sai dela — não há vaga ocupada para liberar.
    if (!wasWaitlisted) {
      // Libera a vaga deixada por quem estava inscrito
      await Course.findOneAndUpdate(
        { _id: courseId, enrolledCount: { $gt: 0 } },
        { $inc: { enrolledCount: -1 } }
      );

      // Promove o primeiro da fila (se houver) — ele assume a vaga liberada
      const next = await Enrollment.findOne({ course: courseId, status: ENROLLMENT_STATUS.WAITING_LIST })
        .sort({ createdAt: 1 });

      if (next) {
        const taken = await Course.findOneAndUpdate(
          { _id: courseId, $expr: { $lt: ['$enrolledCount', '$maxSlots'] } },
          { $inc: { enrolledCount: 1 } },
          { new: true }
        );
        if (taken) {
          next.status = ENROLLMENT_STATUS.ENROLLED;
          await next.save();
          promoted = true;
          course = taken;
        }
      }
      if (!promoted) course = await Course.findById(courseId);
    }

    res.json({
      success: true,
      message: wasWaitlisted ? 'Você saiu da fila de espera.' : 'Inscrição cancelada com sucesso',
      promoted,
      enrolledCount: course ? course.enrolledCount : undefined,
    });
  } catch (err) { next(err); }
};

// GET /courses/:courseId/students — lista alunos inscritos (professor/admin)
// Exclui quem está apenas na fila de espera (ainda não ocupa vaga)
const getCourseStudents = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({
      course: req.params.courseId,
      status: { $nin: [ENROLLMENT_STATUS.CANCELED, ENROLLMENT_STATUS.WAITING_LIST] },
    })
      .populate('user', 'name email avatar school schoolLevel birthDate')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: enrollments });
  } catch (err) { next(err); }
};

const updateSituation = async (req, res, next) => {
  try {
    const { situation } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Inscrição não encontrada',
      });
    }

    enrollment.situation = situation;

    await enrollment.save();

    res.json({
      success: true,
      data: enrollment,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { enroll, getMyEnrollments, checkEnrollment, cancelEnrollment, getCourseStudents, updateSituation };