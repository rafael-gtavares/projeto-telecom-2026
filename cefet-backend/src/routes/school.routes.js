const express = require('express');
const router = express.Router();

const {
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  getActiveSchools,
} = require('../controllers/schools.controller');

const verifyJWT = require('../middleware/auth');
const requireRole = require('../middleware/roles');

// ─── Pública — usada no formulário de cadastro ────────────────────────────────
router.get('/', getActiveSchools);

// ─── Admin — gerenciamento completo ───────────────────────────────────────────
router.get('/admin', verifyJWT, requireRole('admin'), getAllSchools);
router.post('/', verifyJWT, requireRole('admin'), createSchool);
router.put('/:id', verifyJWT, requireRole('admin'), updateSchool);
router.delete('/:id', verifyJWT, requireRole('admin'), deleteSchool);

module.exports = router;