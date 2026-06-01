const router = require('express').Router();
const { getMe, updateMe, getUsers, updateUserRole } = require('../controllers/users.controller');
const verifyJWT = require('../middleware/auth');
const requireRole = require('../middleware/roles');

router.get('/me', verifyJWT, getMe);
router.put('/me', verifyJWT, updateMe);
router.get('/', verifyJWT, requireRole('admin'), getUsers);
router.put('/:id/role', verifyJWT, requireRole('admin'), updateUserRole);

module.exports = router;
