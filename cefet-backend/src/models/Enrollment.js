const mongoose = require('mongoose');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus')
const { ENROLLMENT_SITUATION } = require('../constants/enrollmentSituation')
const { CERTIFICATE_STATUS } = require('../constants/certificateStatus')

const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: Object.values(ENROLLMENT_STATUS), default: ENROLLMENT_STATUS.ENROLLED },
  situation: { type: String, enum: Object.values(ENROLLMENT_SITUATION), default: ENROLLMENT_SITUATION.NOT_RELEASED },
  // true quando o gestor definiu a situação manualmente — o cálculo automático
  // deixa de sobrescrever esse aluno até voltar para "automático".
  situationManual: { type: Boolean, default: false },
  // Nota final calculada pelo sistema de avaliações. Sem max fixo porque no
  // modo "soma" o valor é em pontos (pode passar de 10).
  averageGrade: { type: Number, min: 0, default: null },

  // Certificado de conclusão. Relevante quando o curso está encerrado.
  // 'em_analise' (padrão) até um gestor do curso liberar → 'emitido'.
  certificateStatus: { type: String, enum: Object.values(CERTIFICATE_STATUS), default: CERTIFICATE_STATUS.UNDER_REVIEW },
  certificateIssuedAt: { type: Date, default: null },
  certificateIssuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Assinatura "congelada" no momento da emissão. Um certificado emitido é
  // imutável: alterar/remover a assinatura no perfil NÃO afeta este snapshot.
  // Só é regravado se o certificado for revogado e emitido novamente.
  certificateSignature: {
    name: { type: String, default: null },
    text: { type: String, default: null },
    font: { type: String, default: null },
  },
}, { timestamps: true });

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
