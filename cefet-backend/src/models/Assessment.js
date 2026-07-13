const mongoose = require('mongoose');
const { ASSESSMENT_TYPES } = require('../constants/assessmentTypes');

// Definição de uma avaliação do curso (prova, trabalho, etc.).
// É apenas um "registro de nota" — não há prova/entrega no sistema; o professor
// lança manualmente a nota de cada aluno. As notas ficam em AssessmentScore.
const assessmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  type: {
    type: String,
    enum: Object.values(ASSESSMENT_TYPES),
    default: ASSESSMENT_TYPES.EXAM,
  },
  // Nota máxima da avaliação. No modo "soma" é quanto ela vale em pontos;
  // nos modos de média fica em 10 (nota de 0 a 10).
  maxScore: { type: Number, default: 10, min: 0.5, max: 1000 },
  // Peso na média ponderada (ignorado nos outros métodos).
  weight: { type: Number, default: 1, min: 0, max: 100 },
  order: { type: Number, default: 0 },
  // Enquanto false, os alunos não veem a nota desta avaliação nem ela conta
  // para o cálculo automático de aprovação. O admin publica ao terminar.
  published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
