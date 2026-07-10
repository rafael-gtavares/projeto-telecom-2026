const router = require('express').Router({ mergeParams: true }); // mergeParams p/ :courseId
const {
  getForm, saveForm, getStudentFeedback, submitResponse, editResponse, getResults,
} = require('../controllers/feedback.controller');
const verifyJWT = require('../middleware/auth');
const requireCourseAccess = require('../middleware/courseAccess');
const requireCourseView = require('../middleware/courseView');

// Gestão do formulário e análise das respostas — só gestores do curso
router.get('/form', verifyJWT, requireCourseAccess, getForm);
router.put('/form', verifyJWT, requireCourseAccess, saveForm);
router.get('/results', verifyJWT, requireCourseAccess, getResults);

// Visão do aluno (inscrito) — ver disponibilidade/formulário, enviar e editar
router.get('/', verifyJWT, requireCourseView, getStudentFeedback);
router.post('/response', verifyJWT, requireCourseView, submitResponse);
router.put('/response', verifyJWT, requireCourseView, editResponse);

module.exports = router;
