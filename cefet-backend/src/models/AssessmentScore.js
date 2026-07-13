const mongoose = require('mongoose');

// Nota de um aluno em uma avaliação. Um documento por (avaliação, aluno).
const assessmentScoreSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true, min: 0 },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Impede duas notas para o mesmo aluno na mesma avaliação (upsert usa esse índice).
assessmentScoreSchema.index({ assessment: 1, student: 1 }, { unique: true });
assessmentScoreSchema.index({ course: 1, student: 1 });

module.exports = mongoose.model('AssessmentScore', assessmentScoreSchema);
