const Notification = require('../models/Notification');

// GET /notifications — lista as notificações do usuário logado + contador de não lidas.
// Usada tanto pelo painel (lista) quanto pelo polling do sino (unreadCount).
const getMyNotifications = async (req, res, next) => {
  try {
    const [items, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user.id })
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ recipient: req.user.id, read: false }),
    ]);
    res.json({ success: true, data: { items, unreadCount } });
  } catch (err) { next(err); }
};

// PATCH /notifications/:id/read — marca UMA notificação como lida
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notification)
      return res.status(404).json({ success: false, message: 'Notificação não encontrada' });
    res.json({ success: true, data: notification });
  } catch (err) { next(err); }
};

// PATCH /notifications/read-all — marca todas as não lidas como lidas
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'Notificações marcadas como lidas' });
  } catch (err) { next(err); }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
