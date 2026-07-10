const mongoose = require('mongoose');

// Resposta de UMA questão. Guarda um "snapshot" do enunciado/tipo para que a
// visualização individual continue fazendo sentido mesmo se o formulário for
// editado depois. A agregação (visão geral) casa pelo `question` (id da questão).
const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, required: true }, // _id da questão no FeedbackForm
  type: { type: String, enum: ['multiple_choice', 'stars', 'text'], required: true },
  questionTitle: { type: String, default: '' }, // snapshot do enunciado

  optionIndex: { type: Number, default: null }, // multiple_choice
  optionText: { type: String, default: '' },    // snapshot da alternativa escolhida
  stars: { type: Number, default: null },       // stars
  text: { type: String, default: '' },          // text
}, { _id: false });

// Uma resposta por aluno por curso.
const feedbackResponseSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: { type: [answerSchema], default: [] },

  // Controle de edição: o aluno pode editar no máximo 1 vez por dia.
  lastEditedAt: { type: Date, default: null },
  editCount: { type: Number, default: 0 },
}, { timestamps: true });

feedbackResponseSchema.index({ course: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('FeedbackResponse', feedbackResponseSchema);
