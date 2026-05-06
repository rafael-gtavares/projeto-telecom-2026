const router = require('express').Router();
const { getStats } = require('../controllers/admin.controller');
const verifyJWT = require('../middleware/auth');
const requireRole = require('../middleware/roles');

router.get('/stats', verifyJWT, requireRole('admin', 'professor'), getStats);

module.exports = router;
