const router = require('express').Router();
const {
  getSchools,
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} = require('../controllers/schools.controller');
const verifyJWT = require('../middleware/auth');
const requireRole = require('../middleware/roles');

// Pública — usada no cadastro e perfil (qualquer um pode listar escolas ativas)
router.get('/', getSchools);

// Admin only
router.get('/all', verifyJWT, requireRole('admin'), getAllSchools);
router.post('/', verifyJWT, requireRole('admin'), createSchool);
router.put('/:id', verifyJWT, requireRole('admin'), updateSchool);
router.delete('/:id', verifyJWT, requireRole('admin'), deleteSchool);

module.exports = router;
