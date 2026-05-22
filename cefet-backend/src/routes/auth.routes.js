const router = require('express').Router();
const { register, login, refresh, verifyEmail } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/verify-email/:token', verifyEmail)

module.exports = router;
