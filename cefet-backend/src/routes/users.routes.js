const router = require('express').Router();
const { verify } = require('jsonwebtoken');
const { getMe, updateMe, getUsers, getUsersBase, updateUserRole } = require('../controllers/users.controller');
const verifyJWT = require('../middleware/auth');
const requireRole = require('../middleware/roles');

router.get('/me', verifyJWT, getMe);
router.put('/me', verifyJWT, updateMe);
router.get('/', verifyJWT, requireRole('admin'), getUsers);
router.get('/base', verifyJWT, requireRole('admin', 'professor'), getUsersBase)
router.put('/:id/role', verifyJWT, requireRole('admin'), updateUserRole);

module.exports = router;
