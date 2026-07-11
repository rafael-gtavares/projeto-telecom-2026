const mongoose = require('mongoose');

// Registro leve de acesso a uma página (analytics). Um documento por navegação.
// Sem IP nem dados pessoais: guarda a rota, o usuário (se logado) e um id
// anônimo de visitante gerado no cliente — suficiente para métricas agregadas.
const pageViewSchema = new mongoose.Schema({
  path: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  visitorId: { type: String, default: null }, // id anônimo (localStorage do cliente)
  authenticated: { type: Boolean, default: false },
}, { timestamps: true });

pageViewSchema.index({ createdAt: -1 });
pageViewSchema.index({ visitorId: 1, createdAt: -1 });

// Armazenamento limitado: expira automaticamente após 120 dias.
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 * 24 * 60 * 60 });

module.exports = mongoose.model('PageView', pageViewSchema);
