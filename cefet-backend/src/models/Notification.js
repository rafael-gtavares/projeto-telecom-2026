const mongoose = require('mongoose');

// Notificação individual entregue a um usuário (recipient).
// Gerada quando o professor/admin publica material novo, lança nota
// ou envia um aviso. Cada destinatário tem seu próprio documento
// (inclusive o campo `read`), o que mantém o "lido/não lido" por pessoa.
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['material', 'grade', 'announcement', 'lesson', 'schedule', 'certificate', 'feedback'],
    required: true,
  },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

  title: { type: String, required: true, trim: true },     // ex.: "Novo material"
  message: { type: String, default: '' },                  // resumo curto

  // Aba do curso que o clique deve abrir (deep-link no front)
  tab: { type: String, enum: ['material', 'notas', 'avisos', 'cronograma', 'certificado', 'feedback'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, default: null }, // id do material/nota/aviso/aula

  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Consulta quente: notificações de um usuário, filtrando por não lidas
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Auto-expiração: a notificação é apagada X dias DEPOIS de lida.
// O TTL do MongoDB só expira documentos cujo campo indexado é uma data;
// as não lidas têm readAt=null, então NUNCA expiram (persistem até serem lidas).
const READ_TTL_DAYS = 7;
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: READ_TTL_DAYS * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
