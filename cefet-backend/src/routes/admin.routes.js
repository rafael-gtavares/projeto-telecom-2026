const router = require('express').Router();
const { getStats } = require('../controllers/admin.controller');
const verifyJWT = require('../middleware/auth');
const requireRole = require('../middleware/roles');

// Rota para testes no postman: router.get('/stats', getStats);

router.get('/stats', verifyJWT, requireRole('admin', 'professor'), getStats);

module.exports = router;
