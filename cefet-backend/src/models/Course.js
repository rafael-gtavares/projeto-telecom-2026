const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },

  // Horário simplificado: data/hora início e fim
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  // Modalidade do curso
  modality: {
    type: String,
    enum: ['presencial', 'ead', 'semi_presencial', 'palestra', 'workshop', 'outro'],
    default: 'presencial',
    required: true,
  },

  // Local (para presencial/semi)
  location: { type: String, trim: true, default: '' },

  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Nome livre do instrutor/palestrante (pode ser diferente do professor que criou o curso)
  instructor: { type: String, trim: true, default: '' },

  // Professores com acesso adicional ao curso
  allowedProfessors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  maxSlots: { type: Number, required: true, min: 1 },
  enrolledCount: { type: Number, default: 0, min: 0 },
  imageUrl: { type: String, default: null },
  status: { type: String, enum: ['draft', 'published', 'em_andamento', 'closed'], default: 'draft' },
  phase: { type: String, enum: ['aguardando_inicio', 'em_andamento', 'encerrado'], default: 'aguardando_inicio' },
}, { timestamps: true });

courseSchema.virtual('availableSlots').get(function () {
  return Math.max(0, this.maxSlots - this.enrolledCount);
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

courseSchema.index({ startDate: 1 });
courseSchema.index({ professor: 1 });

courseSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    this.invalidate('endDate', 'A data de término não pode ser anterior à data de início.');
  }
  next();
});

// Método para verificar se um userId tem acesso de gestão ao curso
courseSchema.methods.hasManageAccess = function (userId, userRole) {
  if (userRole === 'admin') return true;
  const id = userId.toString();
  if (this.professor.toString() === id) return true;
  if (this.allowedProfessors?.some(p => p.toString() === id)) return true;
  return false;
};

module.exports = mongoose.model('Course', courseSchema);