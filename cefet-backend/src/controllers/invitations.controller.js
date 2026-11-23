const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const CourseInvitation = require('../models/CourseInvitation');
const { ROLES, ROLE_HIERARCHY } = require('../constants/roles');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { COURSE_INVITATION_STATUS } = require('../constants/courseInvitationStatus');
const {
  expireInvitations, closeInvitation, getWaitlistCandidates, getMaxInviteDays,
} = require('../helpers/invitationHelper');
const {
  getScheduleConflicts, sendScheduleConflict, getConflictsForCourses,
} = require('../helpers/enrollmentConflictHelper');
const { releaseReservation } = require('../helpers/slotHelper');

const { PENDING, ACCEPTED, DECLINED, CANCELED, EXPIRED } = COURSE_INVITATION_STATUS;

const CLOSED_MESSAGES = {
  [ACCEPTED]: 'Este convite já foi aceito.',
  [DECLINED]: 'Este convite foi recusado.',
  [EXPIRED]: 'O prazo deste convite já venceu e a vaga foi liberada.',
  [CANCELED]: 'Este convite foi cancelado pelo responsável do curso.',
};

const isAdmin = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[ROLES.ADMIN];

// ─── Gestor do curso ────────────────────────────────────────────────────────

// GET /courses/waitlist-sources?excludeId=
// Cursos que o usuário gerencia e que têm gente na fila de espera (inclusive
// cursos já encerrados — o caso típico é convidar a fila de uma edição anterior).
const getWaitlistSources = async (req, res, next) => {
  try {
    const counts = await Enrollment.aggregate([
      { $match: { status: ENROLLMENT_STATUS.WAITING_LIST } },
      { $group: { _id: '$course', waitlistCount: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((c) => [String(c._id), c.waitlistCount]));

    const filter = { _id: { $in: counts.map((c) => c._id) } };
    if (!isAdmin(req.user.role)) {
      filter.$or = [{ professor: req.user.id }, { allowedProfessors: req.user.id }];
    }

    const courses = await Course.find(filter)
      .select('title startDate endDate status modality')
      .sort({ endDate: -1 })
      .lean();

    const excludeId = String(req.query.excludeId || '');
    const data = courses
      .filter((c) => String(c._id) !== excludeId)
      .map((c) => ({ ...c, waitlistCount: countById.get(String(c._id)) || 0 }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /courses/:courseId/waitlist?target=<id>&prerequisites=<id,id>
// Fila de espera do curso de origem, marcando quem pode ser convidado para o
// curso-alvo. Para um curso ainda não criado, o front manda os pré-requisitos.
const getCourseWaitlist = async (req, res, next) => {
  try {
    let target = null;

    if (req.query.target && mongoose.isValidObjectId(req.query.target)) {
      target = await Course.findById(req.query.target).select('prerequisites').lean();
    } else if (req.query.prerequisites) {
      const prerequisites = String(req.query.prerequisites)
        .split(',')
        .filter((id) => mongoose.isValidObjectId(id));
      target = { prerequisites };
    }

    const data = await getWaitlistCandidates(req.course._id, target);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /courses/:courseId/invitations — convites enviados pelo curso
const getCourseInvitations = async (req, res, next) => {
  try {
    await expireInvitations();

    const invitations = await CourseInvitation.find({ course: req.course._id })
      .populate('student', 'name email')
      .populate('sourceCourse', 'title')
      .populate('invitedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: invitations,
      maxInviteDays: getMaxInviteDays(req.course.startDate),
    });
  } catch (err) { next(err); }
};

// DELETE /courses/:courseId/invitations/:id — gestor cancela e libera a vaga
const cancelInvitation = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, message: 'Convite inválido.' });

    const invitation = await closeInvitation(
      { _id: req.params.id, course: req.course._id },
      CANCELED
    );
    if (!invitation)
      return res.status(404).json({ success: false, message: 'Convite pendente não encontrado.' });

    res.json({ success: true, message: 'Convite cancelado e vaga liberada.' });
  } catch (err) { next(err); }
};

// ─── Aluno ──────────────────────────────────────────────────────────────────

// GET /invitations/my — convites do aluno (pendentes primeiro)
const getMyInvitations = async (req, res, next) => {
  try {
    await expireInvitations();

    const invitations = await CourseInvitation.find({ student: req.user.id })
      .populate({
        path: 'course',
        select: 'title description startDate endDate modality location instructor imageUrl scheduleType scheduleConfig professor',
        populate: { path: 'professor', select: 'name' },
      })
      .populate('sourceCourse', 'title')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const valid = invitations.filter((i) => i.course);
    const pendingIds = valid.filter((i) => i.status === PENDING).map((i) => i.course._id);
    const conflicts = await getConflictsForCourses(req.user.id, pendingIds);

    const data = valid
      .map((i) => ({
        ...i,
        conflicts: i.status === PENDING ? (conflicts.get(String(i.course._id)) || []) : [],
      }))
      .sort((a, b) => (a.status === PENDING ? 0 : 1) - (b.status === PENDING ? 0 : 1));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const findOwnInvitation = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ success: false, message: 'Convite inválido.' });
    return null;
  }
  const invitation = await CourseInvitation.findOne({ _id: req.params.id, student: req.user.id });
  if (!invitation) {
    res.status(404).json({ success: false, message: 'Convite não encontrado.' });
    return null;
  }
  if (invitation.status !== PENDING) {
    res.status(400).json({ success: false, message: CLOSED_MESSAGES[invitation.status] });
    return null;
  }
  return invitation;
};

// POST /invitations/:id/accept — matricula o aluno usando a vaga reservada
const acceptInvitation = async (req, res, next) => {
  try {
    await expireInvitations();

    const invitation = await findOwnInvitation(req, res);
    if (!invitation) return;

    const course = await Course.findById(invitation.course).select('_id title');
    if (!course) return res.status(404).json({ success: false, message: 'Curso não encontrado.' });

    // Conflito de horário: a vaga continua reservada até o fim do prazo, para
    // o aluno poder cancelar o curso conflitante e tentar de novo.
    const conflicts = await getScheduleConflicts(req.user.id, course._id);
    if (conflicts.length) return sendScheduleConflict(res, conflicts);

    // Reivindica o convite atomicamente (evita aceite duplo / corrida com a expiração)
    const claimed = await CourseInvitation.findOneAndUpdate(
      { _id: invitation._id, status: PENDING },
      { status: ACCEPTED, respondedAt: new Date() },
      { new: true }
    );
    if (!claimed)
      return res.status(409).json({ success: false, message: 'Este convite não está mais disponível.' });

    let enrollment = await Enrollment.findOne({ user: req.user.id, course: course._id });
    const alreadyHasSeat = enrollment &&
      ![ENROLLMENT_STATUS.WAITING_LIST, ENROLLMENT_STATUS.CANCELED].includes(enrollment.status);

    try {
      if (!enrollment) {
        enrollment = await Enrollment.create({ user: req.user.id, course: course._id });
      } else if (!alreadyHasSeat) {
        // Estava na fila (ou cancelado) do próprio curso: promove
        enrollment.status = ENROLLMENT_STATUS.ENROLLED;
        await enrollment.save();
      }
    } catch (err) {
      // Não conseguiu matricular: devolve o convite para pendente
      await CourseInvitation.updateOne({ _id: claimed._id }, { status: PENDING, respondedAt: null });
      throw err;
    }

    if (alreadyHasSeat) {
      // Já ocupava vaga: a reserva sobra e é liberada para a fila
      await releaseReservation(course._id);
    } else {
      // A vaga reservada vira vaga ocupada
      await Course.updateOne({ _id: course._id }, [{
        $set: {
          enrolledCount: { $add: ['$enrolledCount', 1] },
          reservedCount: { $max: [0, { $subtract: [{ $ifNull: ['$reservedCount', 0] }, 1] }] },
        },
      }]);
    }

    // Sai da fila de espera do curso de origem
    await Enrollment.deleteOne({
      user: req.user.id,
      course: invitation.sourceCourse,
      status: ENROLLMENT_STATUS.WAITING_LIST,
    });

    res.json({
      success: true,
      message: `Convite aceito! Você está inscrito em "${course.title}".`,
      data: enrollment,
    });
  } catch (err) { next(err); }
};

// POST /invitations/:id/decline — recusa e libera a vaga
const declineInvitation = async (req, res, next) => {
  try {
    await expireInvitations();

    const invitation = await findOwnInvitation(req, res);
    if (!invitation) return;

    const closed = await closeInvitation({ _id: invitation._id }, DECLINED);
    if (!closed)
      return res.status(409).json({ success: false, message: 'Este convite não está mais disponível.' });

    res.json({ success: true, message: 'Convite recusado.' });
  } catch (err) { next(err); }
};

module.exports = {
  getWaitlistSources,
  getCourseWaitlist,
  getCourseInvitations,
  cancelInvitation,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
};
