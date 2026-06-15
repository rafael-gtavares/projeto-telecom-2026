const mongoose = require('mongoose');

// Questão de múltipla escolha (autoavaliação — nada é salvo por aluno)
const exerciseSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: { type: [String], default: [] },        // alternativas
  correctIndex: { type: Number, default: 0, min: 0 }, // índice da alternativa correta
});

const lessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },   // "HH:MM"
  endTime: { type: String, required: true },     // "HH:MM"
  modality: {
    type: String,
    enum: ['presencial', 'online', 'hibrido'],
    default: 'presencial',
  },
  location: { type: String, default: '' },
  meetingUrl: { type: String, default: '' },     // link para aulas online
  content: { type: String, default: '' },        // conteúdo da aula em Markdown
  exercises: { type: [exerciseSchema], default: [] }, // questões de múltipla escolha
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

lessonSchema.index({ course: 1, date: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
