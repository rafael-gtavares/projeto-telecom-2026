const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  password: { type: String, required: true, minlength: 6 },
  passwordResetToken: String,
  passwordResetExpires: Date,
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
  role: { type: String, enum: ['aluno', 'professor', 'admin'], default: 'aluno' },
  avatar: { type: String, default: null },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null,
  },
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
  return obj;
};

module.exports = mongoose.model('User', userSchema);
