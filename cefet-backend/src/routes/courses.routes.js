const router = require('express').Router();
const { getCourses, getCourse, getAllCourses, createCourse, updateCourse, deleteCourse, getCourseStats} = require('../controllers/courses.controller');
const verifyJWT = require('../middleware/auth');
const requireRole = require('../middleware/roles');

router.get('/', getCourses);

router.get('/all',
  verifyJWT,
  requireRole('admin', 'professor'),
  getAllCourses
);

router.get('/:id/stats',
  verifyJWT,
  requireRole('admin', 'professor'),
  getCourseStats
);

router.get('/:id', getCourse);

router.post('/',
  verifyJWT,
  requireRole('admin', 'professor'),
  createCourse
);

router.put('/:id',
  verifyJWT,
  requireRole('admin', 'professor'),
  updateCourse
);

router.delete('/:id',
  verifyJWT,
  requireRole('admin', 'professor'),
  deleteCourse
);

module.exports = router;
