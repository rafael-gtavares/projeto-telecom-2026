// Tipos de notificação e a aba do curso que o clique abre (deep-link no front).
const NOTIFICATION_TYPES = {
  MATERIAL: 'material',
  GRADE: 'grade',
  ANNOUNCEMENT: 'announcement',
  LESSON: 'lesson',
  SCHEDULE: 'schedule',
  CERTIFICATE: 'certificate',
  FEEDBACK: 'feedback',
  ENROLLMENT_APPROVED: 'enrollment_approved',
  ENROLLMENT_REJECTED: 'enrollment_rejected',
};

const NOTIFICATION_TABS = {
  MATERIAL: 'material',
  NOTAS: 'notas',
  AVISOS: 'avisos',
  CRONOGRAMA: 'cronograma',
  CERTIFICADO: 'certificado',
  FEEDBACK: 'feedback',
  SOBRE: 'sobre',
};

module.exports = { NOTIFICATION_TYPES, NOTIFICATION_TABS };