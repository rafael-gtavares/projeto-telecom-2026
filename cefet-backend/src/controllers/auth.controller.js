const crypto = require('crypto')
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.services')

const register = async (req, res, next) => {
  try {
    const { name, email, password, birthDate, gender, schoolLevel, incomeRange } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });

    const verificationToken = crypto
      .randomBytes(32)
      .toString('hex')

    const user = await User.create({
      name, email, password, birthDate, gender, schoolLevel, incomeRange,
      verificationToken,
      verificationTokenExpires: Date.now() + 1000 * 60 * 60,
      isVerified: false
    });

    await sendVerificationEmail(
      user.email,
      verificationToken
    )

    res.status(201).json({ success: true, message: 'Cadastro realizado com sucesso', data: user.toPublic() });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

    if (!user.isVerified) {

      const verificationToken = crypto
        .randomBytes(32)
        .toString('hex')

      user.verificationToken = verificationToken

      user.verificationTokenExpires =
        Date.now() + 1000 * 60 * 60

      await user.save()
      console.log('TOKEN SALVO:', verificationToken)

      await sendVerificationEmail(
        user.email,
        verificationToken
      )

      return res.status(401).json({
        success: false,
        message: 'Verifique seu e-mail antes de entrar. Um novo link foi enviado.'
      })
    }

    const payload = { id: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload, rememberMe);

    res.json({ success: true, data: { accessToken, refreshToken, user: user.toPublic() } });
  } catch (err) { next(err); }
};

const verifyEmail = async (req, res, next) => {
  try {

    console.log('VERIFY EMAIL CHAMADO')
    console.log('TOKEN:', req.params.token)

    const { token } = req.params

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: {
        $gt: Date.now()
      }
    })

    console.log('Token recebido:', token)
    console.log('Usuário encontrado:', user)

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      })
    }

    user.isVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined

    await user.save()

    const payload = {
      id: user._id,
      role: user.role
    }

    const accessToken =
      signAccessToken(payload)

    const refreshToken =
      signRefreshToken(payload)

    res.json({
      success: true,

      data: {
        accessToken,
        refreshToken,
        user: user.toPublic()
      }
    })

  } catch (err) {
    next(err)
  }
}

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token ausente' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'Usuário não encontrado' });

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    res.json({ success: true, data: { accessToken } });
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token inválido ou expirado' });
  }
};

// Solicitar redefinição de senha
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email)
      return res.status(400).json({ success: false, message: 'E-mail é obrigatório' })

    const user = await User.findOne({ email })

    // Resposta genérica por segurança — não revela se o email existe ou não
    if (!user)
      return res.json({ success: true, message: 'Se este e-mail estiver cadastrado, você receberá um link em breve.' })

    const resetToken = crypto.randomBytes(32).toString('hex')

    user.passwordResetToken = resetToken
    user.passwordResetExpires = Date.now() + 1000 * 60 * 60 // 1 hora

    await user.save()

    await sendPasswordResetEmail(user.email, resetToken)

    res.json({ success: true, message: 'Se este e-mail estiver cadastrado, você receberá um link em breve.' })
  } catch (err) { next(err) }
}

// Redefinir a senha com o token
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!password)
      return res.status(400).json({ success: false, message: 'Nova senha é obrigatória' })

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    })

    if (!user)
      return res.status(400).json({ success: false, message: 'Token inválido ou expirado' })

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    await user.save()

    res.json({ success: true, message: 'Senha redefinida com sucesso' })
  } catch (err) { next(err) }
}

module.exports = { register, login, refresh, verifyEmail, forgotPassword, resetPassword };
