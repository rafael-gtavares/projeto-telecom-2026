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
  EXTERNAL_LINK: 'external_link',
  COURSE_INVITATION: 'course_invitation',
};

const NOTIFICATION_TABS = {
  MATERIAL: 'material',
  NOTAS: 'notas',
  AVISOS: 'avisos',
  CRONOGRAMA: 'cronograma',
  CERTIFICADO: 'certificado',
  FEEDBACK: 'feedback',
  SOBRE: 'sobre',
  EXTERNO: 'externo',
  // Não é uma aba do curso: o front abre /meus-cursos?tab=convites
  CONVITES: 'convites',
};

module.exports = { NOTIFICATION_TYPES, NOTIFICATION_TABS };