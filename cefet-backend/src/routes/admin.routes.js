const router = require('express').Router();
const { getStats } = require('../controllers/admin.controller');
const verifyJWT = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/roles');
const { ROLES } = require('../constants/roles');

// Rota para testes no postman: router.get('/stats', getStats);

router.get('/stats', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), getStats);

module.exports = router;
