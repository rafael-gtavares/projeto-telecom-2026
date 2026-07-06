const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const { notifyCourseStudents, removeNotificationsByRef } = require('../services/notify');

// GET /courses/:courseId/lessons — lista aulas do curso
const getLessons = async (req, res, next) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId })
      .sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: lessons });
  } catch (err) { next(err); }
};

// POST /courses/:courseId/lessons
const createLesson = async (req, res, next) => {
  try {
    const { title, description, date, startTime, endTime, modality, location, meetingUrl } = req.body;
    if (!title || !date || !startTime || !endTime)
      return res.status(400).json({ success: false, message: 'Título, data, início e fim são obrigatórios' });

    const lesson = await Lesson.create({
      course: req.params.courseId,
      title, description, date, startTime, endTime,
      modality: modality || 'presencial',
      location: location || '',
      meetingUrl: meetingUrl || '',
      createdBy: req.user.id,
    });

    // Notifica a turma sobre a nova aula (best-effort)
    await notifyCourseStudents({
      course: req.params.courseId,
      type: 'lesson',
      title: 'Nova aula no cronograma',
      message: lesson.title,
      tab: 'cronograma',
      refId: lesson._id,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

// PUT /courses/:courseId/lessons/:lessonId
const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findOne({ _id: req.params.lessonId, course: req.params.courseId });
    if (!lesson) return res.status(404).json({ success: false, message: 'Aula não encontrada' });

    // Valida os exercícios (quando enviados)
    if (req.body.exercises !== undefined) {
      if (!Array.isArray(req.body.exercises))
        return res.status(400).json({ success: false, message: 'Exercícios em formato inválido' });
      for (const q of req.body.exercises) {
        const opts = Array.isArray(q.options) ? q.options.filter(o => o && o.trim()) : [];
        if (!q.question || !q.question.trim())
          return res.status(400).json({ success: false, message: 'Toda questão precisa de um enunciado' });
        if (opts.length < 2)
          return res.status(400).json({ success: false, message: 'Cada questão precisa de ao menos 2 alternativas' });
        if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= opts.length)
          return res.status(400).json({ success: false, message: 'Selecione uma alternativa correta válida' });
      }
    }

    // Whitelist de campos editáveis — nunca permite alterar course/createdBy via body
    const ALLOWED_FIELDS = ['title', 'description', 'date', 'startTime', 'endTime', 'modality', 'location', 'meetingUrl', 'content', 'exercises'];
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) lesson[field] = req.body[field];
    }
    await lesson.save();

    // Notifica a turma conforme o que foi alterado (best-effort). O conteúdo e os
    // exercícios são salvos em chamadas separadas pela UI, então cada uma gera
    // a notificação correspondente; edições de data/horário contam como cronograma.
    const notifyBase = { course: req.params.courseId, tab: 'cronograma', refId: lesson._id, createdBy: req.user.id };
    if (req.body.content !== undefined) {
      await notifyCourseStudents({ ...notifyBase, type: 'lesson', title: 'Conteúdo de aula atualizado', message: lesson.title });
    } else if (req.body.exercises !== undefined) {
      await notifyCourseStudents({ ...notifyBase, type: 'lesson', title: 'Exercícios de aula atualizados', message: lesson.title });
    } else {
      await notifyCourseStudents({ ...notifyBase, type: 'schedule', title: 'Aula atualizada', message: lesson.title });
    }

    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

// DELETE /courses/:courseId/lessons/:lessonId
const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findOneAndDelete({ _id: req.params.lessonId, course: req.params.courseId });
    if (!lesson) return res.status(404).json({ success: false, message: 'Aula não encontrada' });

    // Limpa notificações órfãs da aula e avisa a turma da mudança no cronograma
    removeNotificationsByRef(lesson._id);
    await notifyCourseStudents({
      course: req.params.courseId,
      type: 'schedule',
      title: 'Aula removida do cronograma',
      message: lesson.title,
      tab: 'cronograma',
      createdBy: req.user.id,
    });

    res.json({ success: true, message: 'Aula excluída com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { getLessons, createLesson, updateLesson, deleteLesson };
