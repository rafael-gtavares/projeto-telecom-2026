const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  professor: { type: String, required: true, trim: true },
  maxSlots: { type: Number, required: true, min: 1 },
  enrolledCount: { type: Number, default: 0 },
  imageUrl: { type: String, default: null },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
}, { timestamps: true });

courseSchema.virtual('availableSlots').get(function () {
  return Math.max(0, this.maxSlots - this.enrolledCount);
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);
