const router = require('express').Router();
const {
  getCourses, getAllCourses, getCourse, getCourseStats,
  createCourse, updateCourse, deleteCourse,
  addAllowedProfessor, removeAllowedProfessor,
  changeCoursePhase,
} = require('../controllers/courses.controller');
const verifyJWT = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const requireRole = require('../middleware/roles');
const requireCourseAccess = require('../middleware/courseAccess');
const { getCourseStudents } = require('../controllers/enrollments.controller');

// Sub-rotas aninhadas
const lessonsRouter = require('./lessons.routes');
const materialsRouter = require('./materials.routes');
const gradesRouter = require('./grades.routes');

router.get('/', optionalAuth, getCourses);
router.get('/all', verifyJWT, requireRole('admin', 'professor'), getAllCourses);
router.get('/:id', verifyJWT, getCourse); // Obs.: Essa rota está deixando qualquer usuário autenticado acessar
router.get('/:id/stats', verifyJWT, requireRole('admin', 'professor'), getCourseStats)
router.post('/', verifyJWT, requireRole('admin', 'professor'), createCourse);
router.put('/:id', verifyJWT, requireRole('admin', 'professor'), updateCourse);
router.delete('/:id', verifyJWT, requireRole('admin', 'professor'), deleteCourse);

// Permissões de professores no curso
router.post('/:id/allowed-professors', verifyJWT, requireRole('admin', 'professor'), addAllowedProfessor);
router.delete('/:id/allowed-professors/:professorId', verifyJWT, requireRole('admin', 'professor'), removeAllowedProfessor);

// Rota de alunos do curso (Passo 12)
router.get('/:courseId/students', verifyJWT, requireCourseAccess, getCourseStudents);

// Fase do curso
router.patch('/:courseId/phase', verifyJWT, requireCourseAccess, changeCoursePhase);

// Sub-rotas aninhadas (/:courseId/lessons, /:courseId/materials, /:courseId/grades)
router.use('/:courseId/lessons', lessonsRouter);
router.use('/:courseId/materials', materialsRouter);
router.use('/:courseId/grades', gradesRouter);

module.exports = router;
