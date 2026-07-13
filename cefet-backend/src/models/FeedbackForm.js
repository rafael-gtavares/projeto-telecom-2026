const mongoose = require('mongoose');
const { FEEDBACK_QUESTION_TYPES } = require('../constants/feedbackQuestionTypes');

// Uma questão do formulário de feedback do curso. Três tipos:
//  - multiple_choice: enunciado + alternativas (aluno escolhe uma)
//  - stars: nota de 0 a maxStars (ex.: recomendação de 0 a 10)
//  - text: resposta aberta (textarea)
const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(FEEDBACK_QUESTION_TYPES),
    required: true,
  },
  title: { type: String, required: true, trim: true }, // o enunciado da pergunta
  options: { type: [String], default: [] },            // multiple_choice
  maxStars: { type: Number, default: 5, min: 1, max: 10 }, // stars
});

// Um formulário de feedback por curso (o "modelo" que o admin monta).
const feedbackFormSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
  questions: { type: [questionSchema], default: [] },
  // published: quando true (e o curso concluído), os alunos podem responder.
  published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FeedbackForm', feedbackFormSchema);
