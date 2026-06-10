const router = require('express').Router({ mergeParams: true }); // mergeParams para acessar :courseId
const { getLessons, createLesson, updateLesson, deleteLesson } = require('../controllers/lessons.controller');
const verifyJWT = require('../middleware/auth');
const requireCourseAccess = require('../middleware/courseAccess');
const requireCourseView = require('../middleware/courseView');

// Apenas gestores do curso ou alunos inscritos podem ver as aulas
router.get('/', verifyJWT, requireCourseView, getLessons);

// Apenas quem tem acesso ao curso pode criar/editar/deletar
router.post('/', verifyJWT, requireCourseAccess, createLesson);
router.put('/:lessonId', verifyJWT, requireCourseAccess, updateLesson);
router.delete('/:lessonId', verifyJWT, requireCourseAccess, deleteLesson);

module.exports = router;
