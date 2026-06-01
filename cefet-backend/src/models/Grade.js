const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', default: null }, // atividade avaliada
  title: { type: String, required: true, trim: true },   // "Prova 1", "Trabalho Final"
  type: {
    type: String,
    enum: ['prova', 'trabalho', 'exercicio', 'participacao', 'outro'],
    required: true,
  },
  grade: { type: Number, min: 0, max: 10, required: true },
  maxGrade: { type: Number, default: 10 },
  feedback: { type: String, default: '' },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

gradeSchema.index({ course: 1, student: 1 });

module.exports = mongoose.model('Grade', gradeSchema);
