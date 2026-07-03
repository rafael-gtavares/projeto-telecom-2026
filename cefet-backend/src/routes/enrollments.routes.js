const router = require('express').Router();
const { enroll, getMyEnrollments, checkEnrollment, cancelEnrollment, updateSituation, getUserEnrollments } = require('../controllers/enrollments.controller');
const verifyJWT = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/roles')
const { ROLES } = require('../constants/roles');

router.post('/', verifyJWT, enroll);
router.get('/my', verifyJWT, getMyEnrollments);
router.get('/user/:userId', verifyJWT, requireMinimumRole(ROLES.ADMIN), getUserEnrollments)
router.get('/check/:courseId', verifyJWT, checkEnrollment);
router.put('/:id/situation', verifyJWT, requireMinimumRole(ROLES.PROFESSOR), updateSituation);
router.delete('/:courseId', verifyJWT, cancelEnrollment);

module.exports = router;
