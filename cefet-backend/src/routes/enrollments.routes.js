const router = require('express').Router();
const { enroll, getMyEnrollments } = require('../controllers/enrollments.controller');
const verifyJWT = require('../middleware/auth');

router.post('/', verifyJWT, enroll);
router.get('/my', verifyJWT, getMyEnrollments);

module.exports = router;
