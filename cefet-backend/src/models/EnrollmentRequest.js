const mongoose = require('mongoose');
const { ENROLLMENT_REQUEST_STATUS } = require('../constants/enrollmentRequestStatus');

const enrollmentRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: {
    type: String,
    enum: Object.values(ENROLLMENT_REQUEST_STATUS),
    default: ENROLLMENT_REQUEST_STATUS.PENDING,
  },

  // Preenchidos quando a solicitação é resolvida (aprovada/rejeitada/cancelada).
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Motivo opcional informado pelo professor/admin ao rejeitar.
  rejectionReason: { type: String, default: null },
}, { timestamps: true });

// Evita que um aluno envie duas solicitações simultâneas e permite que, caso rejeitado, ele reenvie a solicitação
enrollmentRequestSchema.index({ student: 1, course: 1 }, { unique: true, partialFilterExpression: { status: 'pendente' } });

module.exports = mongoose.model('EnrollmentRequest', enrollmentRequestSchema);