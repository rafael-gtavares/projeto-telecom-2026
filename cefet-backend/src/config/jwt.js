const jwt = require('jsonwebtoken');

// Access token curto: limita a janela de exposição caso vaze.
// O refresh token renova o access silenciosamente, então o usuário não percebe.
const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

// Refresh token longo. "Lembrar-me" → 30 dias; sem "Lembrar-me" → 1 dia.
// O cliente guarda em localStorage (compartilhado entre abas), então a duração
// é a única diferença. Em ambos é MUITO maior que o access → sem logout em 1h.
const signRefreshToken = (payload, rememberMe = false) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: rememberMe
      ? (process.env.JWT_REFRESH_EXPIRES_IN || '30d')
      : (process.env.JWT_REFRESH_SESSION_EXPIRES_IN || '1d'),
  });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
