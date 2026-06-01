const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const {
	register,
	verifyEmail,
	resendVerification,
	login,
	forgotPassword,
	resetPassword,
	validateResetToken,
	refresh,
} = require('../controllers/auth.controller');

// Limita tentativas de login: máx 10 por IP a cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

// Limita cadastros: máx 5 por IP a cada hora (evita criação em massa)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitos cadastros deste IP. Tente novamente em 1 hora.' },
});

router.post('/register', registerLimiter, register);
router.get('/verify-email', verifyEmail);            // GET /auth/verify-email?token=xxx
router.post('/resend-verification', resendVerification);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);       // POST /auth/reset-password?token=xxx
router.get('/validate-reset-token', validateResetToken); // GET /auth/validate-reset-token?token=xxx
router.post('/refresh', refresh);

module.exports = router;
