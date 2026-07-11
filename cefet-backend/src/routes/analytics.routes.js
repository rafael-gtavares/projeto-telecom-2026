const router = require('express').Router();
const optionalAuth = require('../middleware/optionalAuth');
const verifyJWT = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/roles');
const { ROLES } = require('../constants/roles');
const { recordPageView, getAccessStats } = require('../controllers/analytics.controller');

// Registro de acesso — público (conta visitantes anônimos e logados)
router.post('/visit', optionalAuth, recordPageView);

// Estatísticas de acesso — somente administradores
router.get('/access', verifyJWT, requireMinimumRole(ROLES.ADMIN), getAccessStats);

module.exports = router;
