const router = require('express').Router({ mergeParams: true });
const { getCourseGrades, getMyGrades, createGrade, updateGrade, deleteGrade } = require('../controllers/grades.controller');
const verifyJWT = require('../middleware/auth');
const requireCourseAccess = require('../middleware/courseAccess');

// Qualquer usuário autenticado pode ver suas próprias notas (controller verifica matrícula)
router.get('/my', verifyJWT, getMyGrades);

// Professor/admin vê todas as notas
router.get('/', verifyJWT, requireCourseAccess, getCourseGrades);
router.post('/', verifyJWT, requireCourseAccess, createGrade);
router.put('/:gradeId', verifyJWT, requireCourseAccess, updateGrade);
router.delete('/:gradeId', verifyJWT, requireCourseAccess, deleteGrade);

module.exports = router;
