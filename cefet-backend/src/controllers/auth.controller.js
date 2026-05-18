const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');

const register = async (req, res, next) => {
  try {
    const { name, email, password, birthDate, gender, schoolLevel, incomeRange } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });

    const user = await User.create({ name, email, password, birthDate, gender, schoolLevel, incomeRange });
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

    const payload = { id: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload, rememberMe);

    res.json({ success: true, data: { accessToken, refreshToken, user: user.toPublic() } });
  } catch (err) { next(err); }
};

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

module.exports = { register, login, refresh };
