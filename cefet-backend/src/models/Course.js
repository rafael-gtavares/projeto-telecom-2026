const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  dayOfWeek: { 
    type: String, 
    enum: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
    required: true 
  },
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true },
  location: { type: String, required: true, trim: true }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  
  schedule: [sessionSchema],
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  professor: { type: String, required: true, trim: true },
  maxSlots: { type: Number, required: true, min: 1 },
  enrolledCount: { type: Number, default: 0, min: 0 },
  imageUrl: { type: String, default: null },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
}, { timestamps: true });

// Virtual para calcular vagas restantes
courseSchema.virtual('availableSlots').get(function () {
  return Math.max(0, this.maxSlots - this.enrolledCount);
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

courseSchema.index({ startDate: 1 });

// Middleware de validação
courseSchema.pre('validate', function (next) {
  if (this.startDate > this.endDate) {
    this.invalidate('endDate', 'A data de término não pode ser anterior à data de início.');
  }
  
  if (this.schedule && this.schedule.length === 0) {
    this.invalidate('schedule', 'O curso deve ter pelo menos um horário definido.');
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);