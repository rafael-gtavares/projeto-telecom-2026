const router = require('express').Router();
const {
  getSchools,
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} = require('../controllers/schools.controller');
const verifyJWT = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/roles');
const { ROLES } = require('../constants/roles');

// Pública — usada no cadastro e perfil (qualquer um pode listar escolas ativas)
router.get('/', getSchools);

// Admin only
router.get('/all', verifyJWT, requireMinimumRole(ROLES.ADMIN), getAllSchools);
router.post('/', verifyJWT, requireMinimumRole(ROLES.ADMIN), createSchool);
router.put('/:id', verifyJWT, requireMinimumRole(ROLES.ADMIN), updateSchool);
router.delete('/:id', verifyJWT, requireMinimumRole(ROLES.ADMIN), deleteSchool);

module.exports = router;
