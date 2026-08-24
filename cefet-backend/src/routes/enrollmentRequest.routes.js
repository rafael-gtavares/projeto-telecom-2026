const router = require('express').Router();
const {
  requestEnrollment,
  listCourseRequests,
  listMyRequests,
  approveRequest,
  finalizeApproval,
  rejectRequest,
  cancelRequest,
} = require('../controllers/enrollmentRequest');
const { enroll } = require('../controllers/enrollments.controller');
const verifyJWT = require('../middleware/auth');
const requireCourseAccess = require('../middleware/courseAccess');

// Aluno solicita entrada no curso
router.post('/courses/:courseId/enrollment-requests', verifyJWT, requestEnrollment);

// Aluno lista as próprias solicitações
router.get('/enrollment-requests/my', verifyJWT, listMyRequests);

// Professor/admin lista solicitações do curso
router.get('/courses/:courseId/enrollment-requests', verifyJWT, requireCourseAccess, listCourseRequests);

// Professor/admin aprova solicitação → efetiva matrícula (enroll) → finaliza o request
router.patch(
  '/courses/:courseId/enrollment-requests/:id/approve',
  verifyJWT,
  requireCourseAccess,
  (req, res, next) => { req.approverId = req.user.id; next(); },
  approveRequest,
  enroll,
  finalizeApproval
);

// Professor/admin rejeita solicitação
router.patch('/courses/:courseId/enrollment-requests/:id/reject', verifyJWT, requireCourseAccess, rejectRequest);

// Aluno cancela a própria solicitação
router.delete('/enrollment-requests/:id', verifyJWT, cancelRequest);

module.exports = router;