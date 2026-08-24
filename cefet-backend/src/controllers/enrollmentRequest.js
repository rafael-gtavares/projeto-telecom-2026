const EnrollmentRequest = require('../models/EnrollmentRequest');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_REQUEST_STATUS } = require('../constants/enrollmentRequestStatus');
const { notifyEnrollmentRequestResolved } = require('../services/notify');

// POST /courses/:courseId/enrollment-requests
// Aluno solicita entrada no curso.
const requestEnrollment = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Curso não encontrado.' });
        }

        if (course.enrollmentType !== 'approval') {
            return res.status(400).json({ success: false, message: 'Este curso não requer aprovação para matrícula.' });
        }

        const alreadyEnrolled = await Enrollment.findOne({ user: studentId, course: courseId });
        if (alreadyEnrolled) {
            return res.status(409).json({ success: false, message: 'Você já está matriculado neste curso.' });
        }

        const existingPending = await EnrollmentRequest.findOne({
            student: studentId,
            course: courseId,
            status: ENROLLMENT_REQUEST_STATUS.PENDING,
        });
        if (existingPending) {
            return res.status(409).json({ success: false, message: 'Você já possui uma solicitação pendente para este curso.' });
        }

        const request = await EnrollmentRequest.create({ student: studentId, course: courseId });

        return res.status(201).json({ success: true, data: request });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'Você já possui uma solicitação pendente para este curso.' });
        }
        return next(err);
    }
};

// GET /courses/:courseId/enrollment-requests
// Professor/admin lista solicitações do curso. Suporta ?status=pendente
const listCourseRequests = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    const filter = { course: courseId };
    if (status) filter.status = status;

    const requests = await EnrollmentRequest.find(filter)
      .populate({
        path: 'student',
        select: 'name email school',
        populate: { path: 'school', select: 'name' },
      })
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

// GET /users/me/enrollment-requests
// Aluno vê suas próprias solicitações.
const listMyRequests = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = { student: req.user.id };
        if (status) filter.status = status;

        const requests = await EnrollmentRequest.find(filter)
            .populate('course', 'title imageUrl')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: requests });
    } catch (err) { next(err); }
};

// PATCH /enrollment-requests/:id/approve
// req.course já vem populado pelo middleware requireCourseAccess (ver rota).
const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await EnrollmentRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada.',
      });
    }

    if (String(request.course) !== String(req.course._id)) {
      return res.status(400).json({
        success: false,
        message: 'Solicitação não pertence a este curso.',
      });
    }

    if (request.status !== ENROLLMENT_REQUEST_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Esta solicitação já foi resolvida.',
      });
    }

    const alreadyEnrolled = await Enrollment.findOne({
      user: request.student,
      course: request.course,
    });

    if (alreadyEnrolled) {
      return res.status(409).json({
        success: false,
        message: 'Aluno já está matriculado neste curso.',
      });
    }

    // Guarda quem está aprovando
    req.approverId = req.user.id;

    // Guarda a solicitação para o middleware seguinte
    req._resolvingRequest = request;

    // Dados usados pelo controller enroll
    req.body = {
      courseId: String(request.course),
    };

    // O enrollment será criado para o aluno
    req.user = {
      ...req.user,
      id: String(request.student),
    };

    return next();
  } catch (err) {
    next(err);
  }
};

// Roda DEPOIS do controller `enroll` (ver rota) — marca a solicitação como aprovada.
const finalizeApproval = async (req, res, next) => {
  try {
    const request = req._resolvingRequest;
    request.status = ENROLLMENT_REQUEST_STATUS.APPROVED;
    request.resolvedAt = new Date();
    request.resolvedBy = req.approverId;
    await request.save();

    await notifyEnrollmentRequestResolved({
      course: request.course,
      studentId: request.student,
      approved: true,
      createdBy: req.approverId,
    });
  } catch (err) { console.error('Erro ao finalizar aprovação de solicitação:', err); }
};

// PATCH /enrollment-requests/:id/reject
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await EnrollmentRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Solicitação não encontrada.' });
    }
    if (String(request.course) !== String(req.course._id)) {
      return res.status(400).json({ success: false, message: 'Solicitação não pertence a este curso.' });
    }
    if (request.status !== ENROLLMENT_REQUEST_STATUS.PENDING) {
      return res.status(400).json({ success: false, message: 'Esta solicitação já foi resolvida.' });
    }

    request.status = ENROLLMENT_REQUEST_STATUS.REJECTED;
    request.resolvedAt = new Date();
    request.resolvedBy = req.user.id;
    request.rejectionReason = reason || null;
    await request.save();

    await notifyEnrollmentRequestResolved({
      course: request.course,
      studentId: request.student,
      approved: false,
      createdBy: req.user.id,
    });

    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};

// DELETE /enrollment-requests/:id
// Aluno cancela a própria solicitação, somente se ainda pendente.
const cancelRequest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const request = await EnrollmentRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Solicitação não encontrada.' });
        }
        if (String(request.student) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Você não pode cancelar esta solicitação.' });
        }
        if (request.status !== ENROLLMENT_REQUEST_STATUS.PENDING) {
            return res.status(400).json({ success: false, message: 'Apenas solicitações pendentes podem ser canceladas.' });
        }

        request.status = ENROLLMENT_REQUEST_STATUS.CANCELED;
        request.resolvedAt = new Date();
        await request.save();

        res.json({ success: true, data: request });
    } catch (err) { next(err); }
};

module.exports = {
    requestEnrollment,
    listCourseRequests,
    listMyRequests,
    approveRequest,
    finalizeApproval,
    rejectRequest,
    cancelRequest,
};