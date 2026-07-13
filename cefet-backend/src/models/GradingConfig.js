const mongoose = require('mongoose');
const { GRADING_METHODS } = require('../constants/gradingMethods');

// Configuração do sistema de avaliações de um curso (1 por curso).
// Define como a nota final é calculada e a média mínima para aprovação.
const gradingConfigSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
  method: {
    type: String,
    enum: Object.values(GRADING_METHODS),
    default: GRADING_METHODS.WEIGHTED,
  },
  // No modo "soma" é a pontuação mínima; nos modos de média é a nota (0–10) mínima.
  passingGrade: { type: Number, default: 6, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model('GradingConfig', gradingConfigSchema);
