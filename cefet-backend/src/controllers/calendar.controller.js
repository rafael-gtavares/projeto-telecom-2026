const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { findConflicts } = require('../helpers/scheduleConflicts');

// Inscrições que ocupam a agenda do aluno (não conta fila de espera nem cancelada)
const ACTIVE_STATUSES = [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.ACTIVE];

const COURSE_FIELDS = '_id title modality startDate endDate location';
const LESSON_FIELDS = 'course title date startTime endTime modality location';

// GET /courses/calendar — agenda pública (optionalAuth)
// Retorna as aulas de todos os cursos publicados e, se logado, também as dos
// cursos em que o aluno está inscrito (mesmo que não estejam mais publicados),
// para que ele veja o próprio curso em andamento no calendário.
const getCalendar = async (req, res, next) => {
  try {
    const publicCourses = await Course.find({ status: COURSE_STATUS.PUBLISHED }).select(COURSE_FIELDS).lean();
    const courseMap = new Map(publicCourses.map(c => [String(c._id), c]));

    let myCourseIds = [];
    if (req.user?.id) {
      const enrollments = await Enrollment.find(
        { user: req.user.id, status: { $in: ACTIVE_STATUSES } },
        'course'
      ).lean();
      myCourseIds = enrollments.map(e => String(e.course));

      // Garante que cursos inscritos ausentes da listagem pública entrem no mapa
      const missing = myCourseIds.filter(id => !courseMap.has(id));
      if (missing.length) {
        const extra = await Course.find({ _id: { $in: missing } }).select(COURSE_FIELDS).lean();
        for (const c of extra) courseMap.set(String(c._id), c);
      }
    }

    const courseIds = [...courseMap.keys()];
    const lessons = await Lesson.find({ course: { $in: courseIds } })
      .select(LESSON_FIELDS)
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        courses: [...courseMap.values()],
        lessons,
        myCourseIds,
      },
    });
  } catch (err) { next(err); }
};

// GET /enrollments/conflicts/:courseId — choques entre o curso-alvo e a agenda
// atual do aluno logado. Usado para avisar antes da inscrição.
const getCourseConflicts = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const targetCourse = await Course.findById(courseId).select(COURSE_FIELDS).lean();
    if (!targetCourse)
      return res.status(404).json({ success: false, message: 'Curso não encontrado' });

    const enrollments = await Enrollment.find(
      { user: req.user.id, status: { $in: ACTIVE_STATUSES }, course: { $ne: courseId } },
      'course'
    ).lean();

    const otherIds = enrollments.map(e => String(e.course));
    if (otherIds.length === 0)
      return res.json({ success: true, data: { conflicts: [] } });

    const [targetLessons, otherCourses, otherLessons] = await Promise.all([
      Lesson.find({ course: courseId }).select(LESSON_FIELDS).lean(),
      Course.find({ _id: { $in: otherIds } }).select(COURSE_FIELDS).lean(),
      Lesson.find({ course: { $in: otherIds } }).select(LESSON_FIELDS).lean(),
    ]);

    const lessonsByCourse = new Map();
    for (const l of otherLessons) {
      const key = String(l.course);
      if (!lessonsByCourse.has(key)) lessonsByCourse.set(key, []);
      lessonsByCourse.get(key).push(l);
    }

    const conflicts = findConflicts(targetCourse, targetLessons, otherCourses, lessonsByCourse);
    res.json({ success: true, data: { conflicts } });
  } catch (err) { next(err); }
};

module.exports = { getCalendar, getCourseConflicts };
