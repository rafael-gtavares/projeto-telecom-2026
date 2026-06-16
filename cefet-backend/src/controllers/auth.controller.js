const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const School = require('../models/School');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');

// Opções permitidas (devem refletir os enums do model User)
const ALLOWED_GENDERS = ['masculino', 'feminino', 'prefiro_nao_informar'];
const ALLOWED_SCHOOL_LEVELS = ['ensino_fundamental', '1_ou_2_ano_em', 'ultimo_ano_em', 'ensino_medio_finalizado', 'eja'];
const ALLOWED_INCOME = ['ate_1sm', '1_a_2sm', '2_a_3sm', '3_a_5sm', 'acima_5sm', 'prefiro_nao_informar'];

// ─── REGISTER ───────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, birthDate, gender, schoolLevel, incomeRange, school } = req.body;

    // Campos obrigatórios
    if (!name || !name.trim() || !email || !password)
      return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'A senha deve ter ao menos 6 caracteres' });

    // Data de nascimento: obrigatória, válida
    if (!birthDate || isNaN(Date.parse(birthDate)) || new Date(birthDate) > new Date())
      return res.status(400).json({ success: false, message: 'Data de nascimento inválida' });

    // Selects: precisam ser uma das opções permitidas
    if (!ALLOWED_GENDERS.includes(gender))
      return res.status(400).json({ success: false, message: 'Selecione um sexo válido' });
    if (!ALLOWED_SCHOOL_LEVELS.includes(schoolLevel))
      return res.status(400).json({ success: false, message: 'Selecione um nível escolar válido' });
    if (!ALLOWED_INCOME.includes(incomeRange))
      return res.status(400).json({ success: false, message: 'Selecione uma faixa de renda válida' });

    // Escola: "Outra" (null / 'outra' / vazio) é aceito. Se vier um id, precisa existir e estar ativa.
    let schoolId = null;
    if (school && school !== 'outra') {
      if (!mongoose.Types.ObjectId.isValid(school))
        return res.status(400).json({ success: false, message: 'Escola de origem inválida' });
      const found = await School.findOne({ _id: school, active: true });
      if (!found)
        return res.status(400).json({ success: false, message: 'Escola de origem inválida' });
      schoolId = found._id;
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });

    const user = await User.create({
      name, email, password, birthDate, gender, schoolLevel, incomeRange,
      school: schoolId,
      isEmailVerified: false,
    });

    // Gera e salva o token de verificação
    const rawToken = user.generateEmailVerificationToken();
    await user.save();

    // Envia o e-mail (não bloqueia o response se falhar)
    try {
      await sendVerificationEmail(user.email, user.name, rawToken);
    } catch (mailErr) {
      console.error('Erro ao enviar e-mail de verificação:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Cadastro realizado! Verifique seu e-mail para ativar a conta.',
    });
  } catch (err) { next(err); }
};

// ─── VERIFY EMAIL ────────────────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.status(400).json({ success: false, message: 'Token de verificação ausente' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Busca o usuário pelo token — sem filtrar por isEmailVerified
    // Isso permite que o mesmo link funcione em múltiplos dispositivos
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({
        success: false,
        message: 'Link de verificação inválido ou expirado. Solicite um novo.',
        code: 'TOKEN_INVALID',
      });

    // Conta já verificada (link aberto de outro dispositivo após primeira verificação)
    // Retorna sucesso sem alterar nada — comportamento idempotente
    if (user.isEmailVerified) {
      return res.json({
        success: true,
        message: 'E-mail verificado com sucesso! Agora você pode fazer login.',
      });
    }

    // Primeira verificação: marca como verificado
    // NÃO apaga o token nem a expiração — o link continua válido
    // até o vencimento natural de 24h para outros dispositivos
    user.isEmailVerified = true;
    await user.save();

    res.json({ success: true, message: 'E-mail verificado com sucesso! Agora você pode fazer login.' });
  } catch (err) { next(err); }
};

// ─── RESEND VERIFICATION ─────────────────────────────────────────────────────
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'E-mail obrigatório' });

    const user = await User.findOne({ email });

    // Resposta genérica para não revelar se o e-mail existe
    if (!user || user.isEmailVerified)
      return res.json({
        success: true,
        message: 'Se este e-mail estiver cadastrado e não verificado, você receberá um novo link.',
      });

    // Rate limiting: aguardar 60 segundos entre reenvios
    if (user.emailVerificationLastSent) {
      const secondsElapsed = (Date.now() - user.emailVerificationLastSent.getTime()) / 1000;
      if (secondsElapsed < 60) {
        const waitSeconds = Math.ceil(60 - secondsElapsed);
        return res.status(429).json({
          success: false,
          message: `Aguarde ${waitSeconds} segundo(s) antes de solicitar um novo link.`,
          waitSeconds,
        });
      }
    }

    const rawToken = user.generateEmailVerificationToken();
    await user.save();

    try {
      await sendVerificationEmail(user.email, user.name, rawToken);
    } catch (mailErr) {
      console.error('Erro ao reenviar e-mail de verificação:', mailErr.message);
    }

    res.json({
      success: true,
      message: 'Se este e-mail estiver cadastrado e não verificado, você receberá um novo link.',
    });
  } catch (err) { next(err); }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

    // Bloqueia login se e-mail não foi verificado
    if (!user.isEmailVerified)
      return res.status(403).json({
        success: false,
        message: 'Confirme seu e-mail antes de fazer login.',
        code: 'EMAIL_NOT_VERIFIED',
      });

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken(
      { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
      rememberMe
    );

    res.json({ success: true, data: { accessToken, refreshToken, user: user.toPublic() } });
  } catch (err) { next(err); }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'E-mail obrigatório' });

    // Resposta SEMPRE genérica (não revela se o e-mail existe — segurança)
    const genericResponse = {
      success: true,
      message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.',
    };

    const user = await User.findOne({ email });
    if (!user) return res.json(genericResponse);

    // Rate limiting: aguardar 60 segundos entre solicitações
    if (user.passwordResetLastSent) {
      const secondsElapsed = (Date.now() - user.passwordResetLastSent.getTime()) / 1000;
      if (secondsElapsed < 60) {
        const waitSeconds = Math.ceil(60 - secondsElapsed);
        return res.status(429).json({
          success: false,
          message: `Aguarde ${waitSeconds} segundo(s) antes de solicitar novamente.`,
          waitSeconds,
        });
      }
    }

    const rawToken = user.generatePasswordResetToken();
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.name, rawToken);
    } catch (mailErr) {
      console.error('Erro ao enviar e-mail de reset:', mailErr.message);
    }

    res.json(genericResponse);
  } catch (err) { next(err); }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { password, confirmPassword } = req.body;

    if (!token)
      return res.status(400).json({ success: false, message: 'Token ausente' });
    if (!password || !confirmPassword)
      return res.status(400).json({ success: false, message: 'Nova senha e confirmação são obrigatórias' });
    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: 'As senhas não coincidem' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'A senha deve ter no mínimo 6 caracteres' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({
        success: false,
        message: 'Link de redefinição inválido ou expirado.',
        code: 'TOKEN_INVALID',
      });

    // Atualiza a senha e invalida o token
    user.password = password; // o pre-save hook do model fará o hash
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    // Revoga todas as sessões existentes (segurança: recuperação de conta)
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({ success: true, message: 'Senha redefinida com sucesso! Agora você pode fazer login.' });
  } catch (err) { next(err); }
};

// ─── VALIDATE RESET TOKEN ─────────────────────────────────────────────────────
// Endpoint usado pelo frontend para checar se o token ainda é válido ANTES de mostrar o form
const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.status(400).json({ success: false, message: 'Token ausente' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ success: false, valid: false, message: 'Token inválido ou expirado' });

    res.json({ success: true, valid: true });
  } catch (err) { next(err); }
};

// ─── REFRESH ──────────────────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ success: false, message: 'Refresh token ausente' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });

    // Sessão revogada (ex.: senha redefinida) — invalida refresh tokens antigos
    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0))
      return res.status(401).json({ success: false, message: 'Sessão expirada. Faça login novamente.' });

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    res.json({ success: true, data: { accessToken } });
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token inválido ou expirado' });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  validateResetToken,
  refresh,
};
