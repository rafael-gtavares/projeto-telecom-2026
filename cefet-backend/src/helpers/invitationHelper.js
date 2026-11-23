const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const CourseInvitation = require('../models/CourseInvitation');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { COURSE_INVITATION_STATUS } = require('../constants/courseInvitationStatus');
const { brDayStart } = require('./courseStatusHelper');
const { getPrerequisiteStatus } = require('./prerequisiteHelper');
const { hasRoomExpr, releaseReservation } = require('./slotHelper');
const { notifyCourseInvitation } = require('../services/notify');
const { sendCourseInvitationEmail } = require('../config/email');

const DAY_MS = 24 * 60 * 60 * 1000;
const { PENDING } = COURSE_INVITATION_STATUS;

const httpError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ─── Prazo ──────────────────────────────────────────────────────────────────

// Quantos dias inteiros cabem entre agora e o início do curso (00:00 de Brasília
// do primeiro dia). O convite nunca pode vencer depois que o curso começou.
const getMaxInviteDays = (startDate, now = Date.now()) =>
  Math.max(0, Math.floor((brDayStart(startDate) - now) / DAY_MS));

// Se o início do curso foi antecipado, encurta os convites pendentes que
// passariam da nova data de início.
const clampInvitationsToStart = async (courseId, startDate) => {
  const limit = new Date(brDayStart(startDate));
  await CourseInvitation.updateMany(
    { course: courseId, status: PENDING, expiresAt: { $gt: limit } },
    { expiresAt: limit }
  );
};

// ─── Ciclo de vida ──────────────────────────────────────────────────────────

const hasPendingInvitation = (userId, courseId) =>
  CourseInvitation.exists({ student: userId, course: courseId, status: PENDING });

// Encerra um convite pendente (recusado/expirado/cancelado) e libera a vaga.
// A troca de status é atômica (só vale se ainda estiver pendente), então dois
// processos nunca liberam a mesma vaga duas vezes. Retorna o convite ou null.
const closeInvitation = async (filter, status) => {
  const invitation = await CourseInvitation.findOneAndUpdate(
    { ...filter, status: PENDING },
    { status, respondedAt: status === COURSE_INVITATION_STATUS.EXPIRED ? null : new Date() },
    { new: true }
  );
  if (invitation) await releaseReservation(invitation.course);
  return invitation;
};

// Expiração "preguiçosa" (o projeto não tem cron): roda no início das rotas
// que dependem de vagas — mesmo modelo do updateCourseStatus.
const expireInvitations = async () => {
  const due = await CourseInvitation.find(
    { status: PENDING, expiresAt: { $lte: new Date() } },
    '_id'
  ).lean();

  for (const { _id } of due) {
    await closeInvitation({ _id }, COURSE_INVITATION_STATUS.EXPIRED);
  }
};

// ─── Candidatos ─────────────────────────────────────────────────────────────

// Fila de espera do curso de origem, em ordem de chegada, indicando quem pode
// ser convidado para o curso-alvo. `target` pode ser um curso ainda não criado
// ({ prerequisites }), caso em que não há inscrições/convites para checar.
const getWaitlistCandidates = async (sourceCourseId, target) => {
  const waitlist = await Enrollment.find({
    course: sourceCourseId,
    status: ENROLLMENT_STATUS.WAITING_LIST,
  })
    .sort({ createdAt: 1 })
    .populate('user', 'name email')
    .lean();

  const entries = waitlist.filter((e) => e.user);
  const userIds = entries.map((e) => e.user._id);

  const inTarget = new Set();
  const pending = new Set();

  if (target?._id && userIds.length) {
    const [enrollments, invitations] = await Promise.all([
      Enrollment.find({
        course: target._id,
        user: { $in: userIds },
        // fila/cancelado no curso-alvo não impedem: o aceite promove a inscrição
        status: { $nin: [ENROLLMENT_STATUS.WAITING_LIST, ENROLLMENT_STATUS.CANCELED] },
      }, 'user').lean(),
      CourseInvitation.find({ course: target._id, student: { $in: userIds }, status: PENDING }, 'student').lean(),
    ]);
    enrollments.forEach((e) => inTarget.add(String(e.user)));
    invitations.forEach((i) => pending.add(String(i.student)));
  }

  const hasPrereqs = (target?.prerequisites || []).length > 0;

  return Promise.all(entries.map(async (e, index) => {
    const id = String(e.user._id);
    let reason = null;

    if (inTarget.has(id)) reason = 'Já está inscrito neste curso';
    else if (pending.has(id)) reason = 'Já tem um convite pendente';
    else if (hasPrereqs) {
      const prereq = await getPrerequisiteStatus(id, { _id: target._id || 'novo', prerequisites: target.prerequisites });
      if (!prereq.met) reason = 'Não concluiu os pré-requisitos';
    }

    return {
      studentId: id,
      name: e.user.name,
      email: e.user.email,
      position: index + 1,
      waitlistedAt: e.createdAt,
      eligible: !reason,
      reason,
    };
  }));
};

// ─── Envio ──────────────────────────────────────────────────────────────────

// Valida o pedido de convites SEM gravar nada (na criação do curso roda antes
// do Course.create, para não salvar o curso com um convite inválido).
// `target`: { _id?, status, startDate, maxSlots, enrolledCount, reservedCount, prerequisites }
// `input`:  { sourceCourseId, studentIds, days }
const prepareInvitations = async ({ input, target, actor }) => {
  const { sourceCourseId, studentIds, days } = input || {};

  if (!sourceCourseId || !mongoose.isValidObjectId(sourceCourseId))
    throw httpError('Selecione o curso de origem dos convites.');

  const ids = [...new Set((Array.isArray(studentIds) ? studentIds : []).map(String))];
  if (!ids.length) throw httpError('Selecione ao menos uma pessoa para convidar.');
  if (!ids.every((id) => mongoose.isValidObjectId(id))) throw httpError('Lista de convidados inválida.');

  if (target._id && String(target._id) === String(sourceCourseId))
    throw httpError('O curso de origem deve ser diferente deste curso.');

  if (target.status !== COURSE_STATUS.PUBLISHED)
    throw httpError('Os convites só podem ser enviados com o curso publicado.');

  const d = Number(days);
  if (!Number.isInteger(d) || d < 1) throw httpError('Informe o prazo do convite em dias (mínimo de 1 dia).');

  const max = getMaxInviteDays(target.startDate);
  if (max < 1) throw httpError('O curso começa em menos de 1 dia, então não há prazo possível para convites.');
  if (d > max) throw httpError(`O prazo não pode ultrapassar o início do curso (máximo de ${max} dia(s)).`);

  const source = await Course.findById(sourceCourseId).select('title professor allowedProfessors');
  if (!source) throw httpError('Curso de origem não encontrado.', 404);
  if (!source.hasManageAccess(actor.id, actor.role))
    throw httpError('Você não tem acesso ao curso de origem.', 403);

  const candidates = await getWaitlistCandidates(sourceCourseId, target);
  const byId = new Map(candidates.map((c) => [c.studentId, c]));

  const students = ids.map((id) => {
    const c = byId.get(id);
    if (!c) throw httpError(`Uma das pessoas selecionadas não está na fila de espera de "${source.title}".`);
    if (!c.eligible) throw httpError(`${c.name}: ${c.reason.toLowerCase()}.`);
    return c;
  });

  const free = Number(target.maxSlots) - (target.enrolledCount || 0) - (target.reservedCount || 0);
  if (students.length > free)
    throw httpError(`Há apenas ${Math.max(0, free)} vaga(s) livre(s) para ${students.length} convite(s).`, 409);

  return { source, students, expiresAt: new Date(Date.now() + d * DAY_MS) };
};

// Reserva as vagas, cria os convites e avisa os alunos (notificação + e-mail,
// best-effort). Retorna quantos convites foram criados.
const sendInvitations = async ({ course, prepared, actor }) => {
  const { source, students, expiresAt } = prepared;
  const n = students.length;

  const reserved = await Course.findOneAndUpdate(
    { _id: course._id, $expr: hasRoomExpr(n) },
    { $inc: { reservedCount: n } },
    { new: true }
  );
  if (!reserved) throw httpError('Não há vagas livres suficientes para os convites.', 409);

  const created = [];
  for (const s of students) {
    try {
      const invitation = await CourseInvitation.create({
        course: course._id,
        sourceCourse: source._id,
        student: s.studentId,
        invitedBy: actor.id,
        expiresAt,
      });
      created.push({ invitation, student: s });
    } catch (err) {
      // Convite pendente criado em paralelo para a mesma pessoa: ignora
      if (err.code !== 11000) throw err;
    }
  }

  // Devolve as reservas que não viraram convite
  if (created.length < n) {
    await Course.updateOne({ _id: course._id }, { $inc: { reservedCount: -(n - created.length) } });
  }

  await Promise.allSettled(created.map(async ({ invitation, student }) => {
    await notifyCourseInvitation({
      course: course._id,
      studentId: student.studentId,
      invitationId: invitation._id,
      expiresAt,
      createdBy: actor.id,
    });
    try {
      await sendCourseInvitationEmail(student.email, student.name, {
        courseTitle: course.title,
        sourceTitle: source.title,
        expiresAt,
      });
    } catch (err) {
      console.error('[convites] falha ao enviar e-mail:', err.message);
    }
  }));

  return created.length;
};

module.exports = {
  getMaxInviteDays,
  clampInvitationsToStart,
  hasPendingInvitation,
  closeInvitation,
  expireInvitations,
  getWaitlistCandidates,
  prepareInvitations,
  sendInvitations,
};
