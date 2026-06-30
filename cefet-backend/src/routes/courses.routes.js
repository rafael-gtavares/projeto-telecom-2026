const router = require('express').Router();
const {
  getCourses, getAllCourses, getCourse, getCourseStats,
  createCourse, updateCourse, deleteCourse,
  addAllowedProfessor, removeAllowedProfessor,
  changeCoursePhase,
} = require('../controllers/courses.controller');
const verifyJWT = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { requireMinimumRole } = require('../middleware/roles');
const { ROLES } = require('../constants/roles');
const requireCourseAccess = require('../middleware/courseAccess');
const { getCourseStudents } = require('../controllers/enrollments.controller');

// Sub-rotas aninhadas
const lessonsRouter = require('./lessons.routes');
const materialsRouter = require('./materials.routes');
const gradesRouter = require('./grades.routes');

router.get('/', optionalAuth, getCourses);
router.get('/all', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), getAllCourses);
router.get('/:id', verifyJWT, getCourse); // Obs.: Essa rota está deixando qualquer usuário autenticado acessar
router.get('/:id/stats', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), getCourseStats)
router.post('/', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), createCourse);
router.put('/:id', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), updateCourse);
router.delete('/:id', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), deleteCourse);

// Permissões de professores no curso
router.post('/:id/allowed-professors', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), addAllowedProfessor);
router.delete('/:id/allowed-professors/:professorId', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), removeAllowedProfessor);

// Rota de alunos do curso (Passo 12)
router.get('/:courseId/students', verifyJWT, requireCourseAccess, getCourseStudents);

// Fase do curso
router.patch('/:courseId/phase', verifyJWT, requireCourseAccess, changeCoursePhase);

// Sub-rotas aninhadas (/:courseId/lessons, /:courseId/materials, /:courseId/grades)
router.use('/:courseId/lessons', lessonsRouter);
router.use('/:courseId/materials', materialsRouter);
router.use('/:courseId/grades', gradesRouter);

module.exports = router;
