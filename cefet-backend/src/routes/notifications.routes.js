const router = require('express').Router();
const verifyJWT = require('../middleware/auth');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notifications.controller');

// Todas exigem usuário autenticado; cada um só acessa as próprias notificações
router.get('/', verifyJWT, getMyNotifications);
router.patch('/read-all', verifyJWT, markAllAsRead);
router.patch('/:id/read', verifyJWT, markAsRead);

module.exports = router;
