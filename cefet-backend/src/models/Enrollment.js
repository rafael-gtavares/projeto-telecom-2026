const mongoose = require('mongoose');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus')
const { ENROLLMENT_SITUATION } = require('../constants/enrollmentSituation')

const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: Object.values(ENROLLMENT_STATUS), default: ENROLLMENT_STATUS.ENROLLED },
  situation: { type: String, enum: Object.values(ENROLLMENT_SITUATION), default: ENROLLMENT_SITUATION.NOT_RELEASED },
  averageGrade: { type: Number, min: 0, max: 10, default: null },

  // Certificado de conclusão. Relevante quando o curso está encerrado.
  // 'em_analise' (padrão) até um gestor do curso liberar → 'emitido'.
  certificateStatus: { type: String, enum: ['em_analise', 'emitido'], default: 'em_analise' },
  certificateIssuedAt: { type: Date, default: null },
  certificateIssuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
