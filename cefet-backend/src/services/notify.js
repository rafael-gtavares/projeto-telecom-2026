const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');

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
      type: 'material',
      course,
      title: 'Novo material disponível',
      message: material.title,
      tab: 'material',
      refId: material._id,
      createdBy,
    });
  } catch (err) {
    console.error('[notify] notifyNewMaterial falhou:', err.message);
  }
};

// Nota nova → notifica APENAS o aluno avaliado (é algo individual)
const notifyNewGrade = async ({ course, studentId, grade, createdBy }) => {
  try {
    await createNotifications([studentId], {
      type: 'grade',
      course,
      title: 'Nova nota lançada',
      message: grade.title,
      tab: 'notas',
      refId: grade._id,
      createdBy,
    });
  } catch (err) {
    console.error('[notify] notifyNewGrade falhou:', err.message);
  }
};

// Aviso → turma inteira ou um aluno específico
const notifyAnnouncement = async ({ course, announcement, createdBy }) => {
  try {
    const recipients =
      announcement.audience === 'individual'
        ? (announcement.recipients || [])
        : await getEnrolledStudentIds(course);
    await createNotifications(recipients, {
      type: 'announcement',
      course,
      title: 'Novo aviso do professor',
      message: announcement.title,
      tab: 'avisos',
      refId: announcement._id,
      createdBy,
    });
  } catch (err) {
    console.error('[notify] notifyAnnouncement falhou:', err.message);
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
  notifyNewGrade,
  notifyAnnouncement,
  removeNotificationsByRef,
};
