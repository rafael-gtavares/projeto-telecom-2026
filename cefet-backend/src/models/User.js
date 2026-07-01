const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ROLES } = require('../constants/roles')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  birthDate: { type: Date },
  gender: { type: String, enum: ['masculino', 'feminino', 'prefiro_nao_informar'], default: 'prefiro_nao_informar' },
  schoolLevel: {
    type: String,
    required: true,
    enum: [
      'ensino_fundamental',
      '1_ou_2_ano_em',
      'ultimo_ano_em',
      'ensino_medio_finalizado',
      'eja'
    ]
  },
  incomeRange: {
    type: String,
    enum: ['ate_1sm', '1_a_2sm', '2_a_3sm', '3_a_5sm', 'acima_5sm', 'prefiro_nao_informar'],
    default: 'prefiro_nao_informar',
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null,
    // null = "Outras" (usuários antigos ou que não selecionaram)
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.STUDENT
  },
  avatar: { 
    type: String, 
    default: null 
  },
  canEditPersonalInfo: {
    type: Boolean,
    default: false,
  },

  // Versão da sessão: incrementar invalida todos os refresh tokens já emitidos
  // (usado ao redefinir a senha — revoga sessões possivelmente comprometidas).
  tokenVersion: { type: Number, default: 0 },
  // Verificação de e-mail
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },

  // Recuperação de senha
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  passwordResetLastSent: { type: Date, default: null },

  // Reenvio de verificação (rate limiting)
  emailVerificationLastSent: { type: Date, default: null },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.emailVerificationLastSent;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.passwordResetLastSent;
  return obj;
};

// Gera um token de verificação de e-mail (retorna o token bruto, salva o hash)
userSchema.methods.generateEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  this.emailVerificationLastSent = new Date();
  return rawToken; // retorna o token BRUTO para enviar no e-mail
};

// Gera um token de reset de senha (retorna o token bruto, salva o hash)
userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  this.passwordResetLastSent = new Date();
  return rawToken; // retorna o token BRUTO para enviar no e-mail
};

module.exports = mongoose.model('User', userSchema);
