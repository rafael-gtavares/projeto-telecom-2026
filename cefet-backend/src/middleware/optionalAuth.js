const jwt = require('jsonwebtoken');

// Middleware de autenticação opcional:
// Se o token for válido, popula req.user.
// Se não houver token ou for inválido, segue sem req.user (não rejeita).
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
    // Token inválido/expirado — segue sem usuário
  }
  next();
};

module.exports = optionalAuth;
