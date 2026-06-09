const router = require('express').Router();
const { enroll, getMyEnrollments, checkEnrollment, cancelEnrollment } = require('../controllers/enrollments.controller');
const verifyJWT = require('../middleware/auth');

router.post('/', verifyJWT, enroll);
router.get('/my', verifyJWT, getMyEnrollments);
router.get('/check/:courseId', verifyJWT, checkEnrollment);
router.delete('/:courseId', verifyJWT, cancelEnrollment);

module.exports = router;
