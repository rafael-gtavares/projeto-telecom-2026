const router = require('express').Router({ mergeParams: true });
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcements.controller');
const verifyJWT = require('../middleware/auth');
const requireCourseAccess = require('../middleware/courseAccess');
const requireCourseView = require('../middleware/courseView');

// Gestores do curso ou alunos inscritos podem ler os avisos
router.get('/', verifyJWT, requireCourseView, getAnnouncements);

// Apenas quem gerencia o curso pode criar/remover avisos
router.post('/', verifyJWT, requireCourseAccess, createAnnouncement);
router.delete('/:announcementId', verifyJWT, requireCourseAccess, deleteAnnouncement);

module.exports = router;
