const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null }, // opcional

  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['leitura', 'video', 'exercicio', 'prova', 'link', 'outro'],
    required: true,
  },
  content: { type: String, default: '' },  // texto de leitura, URL de vídeo, link externo
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

materialSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Material', materialSchema);
