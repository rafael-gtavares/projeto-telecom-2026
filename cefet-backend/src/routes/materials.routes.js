const router = require('express').Router({ mergeParams: true });
const { getMaterials, createMaterial, updateMaterial, deleteMaterial } = require('../controllers/materials.controller');
const verifyJWT = require('../middleware/auth');
const requireCourseAccess = require('../middleware/courseAccess');
const requireCourseView = require('../middleware/courseView');

// Apenas gestores do curso ou alunos inscritos podem ver materiais
router.get('/', verifyJWT, requireCourseView, getMaterials);

// Apenas gestores do curso podem criar/editar/deletar
router.post('/', verifyJWT, requireCourseAccess, createMaterial);
router.put('/:materialId', verifyJWT, requireCourseAccess, updateMaterial);
router.delete('/:materialId', verifyJWT, requireCourseAccess, deleteMaterial);

module.exports = router;
