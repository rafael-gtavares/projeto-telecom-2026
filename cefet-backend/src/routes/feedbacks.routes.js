const router = require('express').Router();
const {
    getAllFeedbacks,
    getCourseFeedbacks,
    getFeaturedFeedbacks,
    createFeedback,
    toggleFeaturedFeedback,
    deleteFeedback
} = require('../controllers/feedbacks.controller')
const verifyJWT = require('../middleware/auth')
const { requireMinimumRole } = require('../middleware/roles');
const { ROLES } = require('../constants/roles');

router.get('/', verifyJWT, requireMinimumRole(ROLES.ADMIN), getAllFeedbacks);
router.get('/featured', getFeaturedFeedbacks); // pública: aparece na Home
router.get('/course/:idCourse', getCourseFeedbacks); // pública: aparece na página do curso

router.post('/', verifyJWT, createFeedback);
router.put('/:id', verifyJWT, requireMinimumRole(ROLES.ADMIN), toggleFeaturedFeedback);
router.delete('/:id', verifyJWT, deleteFeedback);

module.exports = router;