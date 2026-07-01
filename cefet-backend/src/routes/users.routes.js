const router = require('express').Router();
const { verify } = require('jsonwebtoken');
const { getMe, updateMe, getUsers, getUsersBase, updateUserRole } = require('../controllers/users.controller');
const verifyJWT = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/roles');
const { ROLES } = require('../constants/roles');
const { verifyEditPermission } = require('../middleware/editPermission')

router.get('/me', verifyJWT, getMe);
router.put('/me', verifyJWT, verifyEditPermission, updateMe);
router.get('/', verifyJWT, requireMinimumRole(ROLES.ADMIN), getUsers);
router.get('/base', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), getUsersBase)
router.put('/:id/role', verifyJWT, requireMinimumRole(ROLES.ADMIN), updateUserRole);

module.exports = router;
