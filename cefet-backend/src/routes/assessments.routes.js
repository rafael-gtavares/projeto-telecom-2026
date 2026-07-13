const router = require('express').Router({ mergeParams: true });
const verifyJWT = require('../middleware/auth');
const requireCourseAccess = require('../middleware/courseAccess');
const {
  getAssessments, getMyAssessments, updateConfig,
  createAssessment, updateAssessment, deleteAssessment, saveScores,
} = require('../controllers/assessments.controller');

// Aluno inscrito vê suas próprias avaliações/notas (controller checa matrícula)
router.get('/my', verifyJWT, getMyAssessments);

// Gestor do curso (admin/professor com acesso)
router.get('/', verifyJWT, requireCourseAccess, getAssessments);
router.put('/config', verifyJWT, requireCourseAccess, updateConfig);
router.post('/', verifyJWT, requireCourseAccess, createAssessment);
router.put('/:assessmentId', verifyJWT, requireCourseAccess, updateAssessment);
router.delete('/:assessmentId', verifyJWT, requireCourseAccess, deleteAssessment);
router.put('/:assessmentId/scores', verifyJWT, requireCourseAccess, saveScores);

module.exports = router;
