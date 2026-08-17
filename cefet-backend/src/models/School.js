const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da escola é obrigatório'],
    trim: true,
    maxlength: [120, 'Nome deve ter no máximo 120 caracteres'],
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  contactName: {
    type: String,
    trim: true,
    default: 'Sem nome de contato'
  },
  contactNumber: {
    type: String,
    trim: true,
    default: 'Sem número de contato'
  },
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Índice para evitar escolas duplicadas (mesmo nome + cidade)
schoolSchema.index({ name: 1, city: 1 }, { unique: true });

module.exports = mongoose.model('School', schoolSchema);
