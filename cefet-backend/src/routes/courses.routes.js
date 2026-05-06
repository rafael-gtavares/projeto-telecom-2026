const router = require('express').Router();
const { getCourses, getCourse, createCourse, updateCourse, deleteCourse } = require('../controllers/courses.controller');
const verifyJWT = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const upload = require('../middleware/upload');

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', verifyJWT, requireRole('admin', 'professor'), upload.single('image'), createCourse);
router.put('/:id', verifyJWT, requireRole('admin', 'professor'), upload.single('image'), updateCourse);
router.delete('/:id', verifyJWT, requireRole('admin', 'professor'), deleteCourse);

module.exports = router;
