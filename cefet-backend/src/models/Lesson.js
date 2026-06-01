const mongoose = require('mongoose');

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
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

lessonSchema.index({ course: 1, date: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
