const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

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

    res.status(201).json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

// PUT /courses/:courseId/lessons/:lessonId
const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findOne({ _id: req.params.lessonId, course: req.params.courseId });
    if (!lesson) return res.status(404).json({ success: false, message: 'Aula não encontrada' });

    Object.assign(lesson, req.body);
    await lesson.save();
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

// DELETE /courses/:courseId/lessons/:lessonId
const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findOneAndDelete({ _id: req.params.lessonId, course: req.params.courseId });
    if (!lesson) return res.status(404).json({ success: false, message: 'Aula não encontrada' });
    res.json({ success: true, message: 'Aula excluída com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { getLessons, createLesson, updateLesson, deleteLesson };
