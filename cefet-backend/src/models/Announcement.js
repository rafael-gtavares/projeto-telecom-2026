const mongoose = require('mongoose');
const { ANNOUNCEMENT_AUDIENCE } = require('../constants/announcementAudience');

// Aviso escrito pelo professor/admin que gerencia o curso.
// Pode ir para a turma inteira (audience='all') ou para um aluno
// específico (audience='individual' + recipient). Cada aviso gera
// notificações para quem deve recebê-lo.
const announcementSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },

  audience: { type: String, enum: Object.values(ANNOUNCEMENT_AUDIENCE), default: ANNOUNCEMENT_AUDIENCE.ALL },
  // Só preenchido quando audience='individual' — um ou mais alunos da turma
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Lista os avisos de um curso, mais recentes primeiro
announcementSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
