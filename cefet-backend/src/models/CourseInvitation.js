const mongoose = require('mongoose');
const { COURSE_INVITATION_STATUS } = require('../constants/courseInvitationStatus');

// Convite para um curso enviado a quem ficou na fila de espera de OUTRO curso
// (normalmente uma edição anterior já encerrada). Enquanto pendente, o convite
// reserva uma vaga no curso (Course.reservedCount) até `expiresAt`.
const courseInvitationSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  sourceCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: {
    type: String,
    enum: Object.values(COURSE_INVITATION_STATUS),
    default: COURSE_INVITATION_STATUS.PENDING,
  },
  expiresAt: { type: Date, required: true },
  respondedAt: { type: Date, default: null },
}, { timestamps: true });

// Um único convite pendente por aluno e curso (pode ser reconvidado depois)
courseInvitationSchema.index(
  { course: 1, student: 1 },
  { unique: true, partialFilterExpression: { status: COURSE_INVITATION_STATUS.PENDING } }
);
// Varredura de expiração
courseInvitationSchema.index({ status: 1, expiresAt: 1 });
courseInvitationSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('CourseInvitation', courseInvitationSchema);
