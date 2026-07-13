const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const FeedbackForm = require('../models/FeedbackForm');
const FeedbackResponse = require('../models/FeedbackResponse');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { NOTIFICATION_TYPES, NOTIFICATION_TABS } = require('../constants/notifications');
const { ANNOUNCEMENT_AUDIENCE } = require('../constants/announcementAudience');

// IDs dos alunos com vaga confirmada no curso (mesma regra de getCourseStudents:
// exclui cancelados e quem está só na fila de espera).
const getEnrolledStudentIds = async (courseId) => {
  const enrollments = await Enrollment.find(
    {
      course: courseId,
      status: { $nin: [ENROLLMENT_STATUS.CANCELED, ENROLLMENT_STATUS.WAITING_LIST] },
    },
    'user'
  ).lean();
  return enrollments.map((e) => e.user);
};

// Cria uma notificação para cada destinatário. Best-effort: qualquer erro é
// logado e engolido para NÃO derrubar a ação que a originou (criar material,
// lançar nota, enviar aviso). Notificação é secundária ao fluxo principal.
const createNotifications = async (recipientIds, base) => {
  try {
    const ids = (recipientIds || []).filter(Boolean);
    if (ids.length === 0) return;
    const docs = ids.map((recipient) => ({ ...base, recipient }));
    await Notification.insertMany(docs, { ordered: false });
  } catch (err) {
    console.error('[notify] falha ao criar notificações:', err.message);
  }
};

// Notifica a turma toda (inscritos com vaga) com um payload arbitrário.
// Usado para aulas e mudanças de cronograma. Nunca lança.
const notifyCourseStudents = async ({ course, type, title, message = '', tab, refId = null, createdBy = null }) => {
  try {
    const recipients = await getEnrolledStudentIds(course);
    await createNotifications(recipients, { type, course, title, message, tab, refId, createdBy });
  } catch (err) {
    console.error('[notify] notifyCourseStudents falhou:', err.message);
  }
};

// Material novo → notifica a turma toda.
// Nunca lança: notificação é secundária à ação que a originou.
const notifyNewMaterial = async ({ course, material, createdBy }) => {
  try {
    const recipients = await getEnrolledStudentIds(course);
    await createNotifications(recipients, {
      type: NOTIFICATION_TYPES.MATERIAL,
      course,
      title: 'Novo material disponível',
      message: material.title,
      tab: NOTIFICATION_TABS.MATERIAL,
      refId: material._id,
      createdBy,
    });
  } catch (err) {
    console.error('[notify] notifyNewMaterial falhou:', err.message);
  }
};

// Notas publicadas → notifica os alunos que receberam nota naquela avaliação.
const notifyGradesPublished = async ({ course, studentIds, assessmentTitle, createdBy }) => {
  try {
    await createNotifications((studentIds || []).filter(Boolean), {
      type: NOTIFICATION_TYPES.GRADE,
      course,
      title: 'Notas publicadas',
      message: assessmentTitle,
      tab: NOTIFICATION_TABS.NOTAS,
      refId: null,
      createdBy,
    });
  } catch (err) {
    console.error('[notify] notifyGradesPublished falhou:', err.message);
  }
};

// Certificado liberado → notifica APENAS o aluno
const notifyCertificate = async ({ course, studentId, createdBy }) => {
  try {
    await createNotifications([studentId], {
      type: NOTIFICATION_TYPES.CERTIFICATE,
      course,
      title: 'Certificado disponível',
      message: 'Seu certificado de conclusão já pode ser acessado.',
      tab: NOTIFICATION_TABS.CERTIFICADO,
      refId: null,
      createdBy,
    });
  } catch (err) {
    console.error('[notify] notifyCertificate falhou:', err.message);
  }
};

// Aviso → turma inteira ou um aluno específico
const notifyAnnouncement = async ({ course, announcement, createdBy }) => {
  try {
    const recipients =
      announcement.audience === ANNOUNCEMENT_AUDIENCE.INDIVIDUAL
        ? (announcement.recipients || [])
        : await getEnrolledStudentIds(course);
    await createNotifications(recipients, {
      type: NOTIFICATION_TYPES.ANNOUNCEMENT,
      course,
      title: 'Novo aviso do professor',
      message: announcement.title,
      tab: NOTIFICATION_TABS.AVISOS,
      refId: announcement._id,
      createdBy,
    });
  } catch (err) {
    console.error('[notify] notifyAnnouncement falhou:', err.message);
  }
};

// Curso concluído + formulário de feedback publicado → convida os alunos a
// avaliar o curso. Só notifica quem ainda NÃO respondeu e ainda NÃO foi
// notificado (dedupe), então é seguro chamar tanto no fechamento do curso
// quanto na publicação do formulário. Nunca lança.
const notifyFeedbackAvailable = async ({ course, createdBy = null }) => {
  try {
    const form = await FeedbackForm.findOne({ course, published: true }, 'questions').lean();
    if (!form || !(form.questions || []).length) return;

    const recipients = await getEnrolledStudentIds(course);
    if (recipients.length === 0) return;

    const [responded, already] = await Promise.all([
      FeedbackResponse.find({ course, user: { $in: recipients } }, 'user').lean(),
      Notification.find({ course, type: NOTIFICATION_TYPES.FEEDBACK, recipient: { $in: recipients } }, 'recipient').lean(),
    ]);
    const skip = new Set([
      ...responded.map((r) => String(r.user)),
      ...already.map((n) => String(n.recipient)),
    ]);
    const targets = recipients.filter((u) => !skip.has(String(u)));

    await createNotifications(targets, {
      type: NOTIFICATION_TYPES.FEEDBACK,
      course,
      title: 'Avalie o curso',
      message: 'Conte como foi sua experiência no curso — leva menos de 1 minuto.',
      tab: NOTIFICATION_TABS.FEEDBACK,
      refId: null,
      createdBy,
    });
  } catch (err) {
    console.error('[notify] notifyFeedbackAvailable falhou:', err.message);
  }
};

// Remove as notificações geradas por um material/nota/aviso que foi excluído,
// para não deixar notificação órfã apontando para algo que não existe mais.
// Best-effort: nunca lança.
const removeNotificationsByRef = async (refId) => {
  try {
    if (!refId) return;
    await Notification.deleteMany({ refId });
  } catch (err) {
    console.error('[notify] removeNotificationsByRef falhou:', err.message);
  }
};

module.exports = {
  getEnrolledStudentIds,
  notifyCourseStudents,
  notifyNewMaterial,
  notifyGradesPublished,
  notifyAnnouncement,
  notifyCertificate,
  notifyFeedbackAvailable,
  removeNotificationsByRef,
};
