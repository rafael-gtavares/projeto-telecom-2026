const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { notifyAnnouncement, removeNotificationsByRef } = require('../services/notify');

// GET /courses/:courseId/announcements
// Quem gerencia o curso vê todos os avisos; o aluno vê os da turma
// (audience='all') e os individuais endereçados a ele.
const getAnnouncements = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    // req.course é populado por requireCourseView (evita nova consulta)
    const course = req.course || await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    const isManager = course.hasManageAccess(req.user.id, req.user.role);

    const filter = isManager
      ? { course: courseId }
      : {
          course: courseId,
          $or: [{ audience: 'all' }, { recipients: req.user.id }],
        };

    const announcements = await Announcement.find(filter)
      .populate('author', 'name')
      .populate('recipients', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: announcements });
  } catch (err) { next(err); }
};

// POST /courses/:courseId/announcements — só quem gerencia o curso (requireCourseAccess)
const createAnnouncement = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, message, audience = 'all' } = req.body;
    // Aceita `recipients` (array) — mantém compat com `recipient` (single)
    let recipients = req.body.recipients;
    if (!Array.isArray(recipients)) {
      recipients = req.body.recipient ? [req.body.recipient] : [];
    }

    if (!title || !message)
      return res.status(400).json({ success: false, message: 'Título e mensagem são obrigatórios' });

    if (!['all', 'individual'].includes(audience))
      return res.status(400).json({ success: false, message: 'Público inválido' });

    let recipientIds = [];
    if (audience === 'individual') {
      // Remove duplicatas e vazios
      const unique = [...new Set(recipients.filter(Boolean).map(String))];
      if (unique.length === 0)
        return res.status(400).json({ success: false, message: 'Selecione ao menos um aluno destinatário' });

      // Todos os destinatários precisam ter vaga confirmada no curso
      const enrolled = await Enrollment.find({
        user: { $in: unique },
        course: courseId,
        status: { $nin: [ENROLLMENT_STATUS.CANCELED, ENROLLMENT_STATUS.WAITING_LIST] },
      }, 'user').lean();

      const enrolledIds = new Set(enrolled.map((e) => String(e.user)));
      const invalid = unique.filter((id) => !enrolledIds.has(id));
      if (invalid.length > 0)
        return res.status(400).json({ success: false, message: 'Um ou mais alunos não estão inscritos neste curso' });

      recipientIds = unique;
    }

    const announcement = await Announcement.create({
      course: courseId,
      author: req.user.id,
      title,
      message,
      audience,
      recipients: recipientIds,
    });

    // Dispara notificações (best-effort — não derruba a criação do aviso)
    await notifyAnnouncement({ course: courseId, announcement, createdBy: req.user.id });

    await announcement.populate('author', 'name');
    await announcement.populate('recipients', 'name');
    res.status(201).json({ success: true, data: announcement });
  } catch (err) { next(err); }
};

// DELETE /courses/:courseId/announcements/:announcementId — só quem gerencia
const deleteAnnouncement = async (req, res, next) => {
  try {
    const { courseId, announcementId } = req.params;
    const announcement = await Announcement.findOneAndDelete({ _id: announcementId, course: courseId });
    if (!announcement)
      return res.status(404).json({ success: false, message: 'Aviso não encontrado' });

    // Remove as notificações geradas por este aviso (best-effort)
    removeNotificationsByRef(announcementId);

    res.json({ success: true, message: 'Aviso removido com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
