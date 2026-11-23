const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { timeToMinutes, rangesOverlap } = require('./scheduleConflicts');
const { buildLessons } = require('./scheduleHelper');

// Matrículas que ocupam a agenda do aluno e, portanto, podem gerar bloqueio.
// Mesma definição usada em calendar.controller.js (fila de espera, concluída e
// cancelada não bloqueiam).
const BLOCKING_STATUSES = [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.ACTIVE];

const COURSE_FIELDS = '_id title startDate endDate scheduleType scheduleConfig modality location professor';

// Dia civil da aula ('YYYY-MM-DD'), em UTC — as aulas são gravadas à meia-noite UTC
const dayOf = (date) => new Date(date).toISOString().slice(0, 10);

// Duas aulas conflitam quando caem na MESMA DATA e os horários se sobrepõem.
// Intervalos são [início, fim): 14:00–16:00 e 16:00–18:00 NÃO conflitam.
const lessonsOverlap = (a, b) =>
  dayOf(a.date) === dayOf(b.date) &&
  rangesOverlap(
    timeToMinutes(a.startTime), timeToMinutes(a.endTime),
    timeToMinutes(b.startTime), timeToMinutes(b.endTime)
  );

// Aulas efetivas do curso: as da coleção Lesson; se o curso ainda não tiver
// nenhuma (registro antigo), deriva do cronograma salvo no próprio curso.
const resolveLessons = (course, lessons) => {
  if (lessons && lessons.length) return lessons;
  try {
    return buildLessons({
      courseId: course._id,
      scheduleType: course.scheduleType,
      scheduleConfig: course.scheduleConfig,
      startDate: course.startDate,
      endDate: course.endDate,
      modality: course.modality,
      location: course.location,
      createdBy: course.professor,
    });
  } catch {
    return [];
  }
};

const groupByCourse = (lessons) => {
  const map = new Map();
  for (const l of lessons) {
    const key = String(l.course);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(l);
  }
  return map;
};

// Compara as aulas de um curso-alvo com as de cada curso já matriculado.
// Retorna [{ course: { _id, title }, slots: [{ date, startTime, endTime }] }]
// (`slots` = aulas do curso JÁ MATRICULADO que colidem com o alvo).
const compareCourses = (targetLessons, enrolledCourses, lessonsByCourse) => {
  const out = [];

  for (const other of enrolledCourses) {
    const otherLessons = resolveLessons(other, lessonsByCourse.get(String(other._id)));
    const slots = [];

    for (const ol of otherLessons) {
      if (targetLessons.some((tl) => lessonsOverlap(tl, ol))) {
        slots.push({ date: dayOf(ol.date), startTime: ol.startTime, endTime: ol.endTime });
      }
    }

    if (slots.length) {
      slots.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      out.push({ course: { _id: other._id, title: other.title }, slots });
    }
  }

  return out;
};

// Conflitos de VÁRIOS cursos-alvo de uma só vez (usado na listagem da Home —
// sem N+1). Retorna Map<courseId, conflicts[]>; só tem chave quem tem conflito.
const getConflictsForCourses = async (userId, targetCourseIds) => {
  const result = new Map();
  const targetIds = [...new Set(targetCourseIds.map(String))];
  if (!userId || !targetIds.length) return result;

  const enrollments = await Enrollment.find(
    { user: userId, status: { $in: BLOCKING_STATUSES } },
    'course'
  ).lean();
  const enrolledIds = [...new Set(enrollments.map((e) => String(e.course)))];
  if (!enrolledIds.length) return result;

  const allIds = [...new Set([...enrolledIds, ...targetIds])];
  const [courses, lessons] = await Promise.all([
    Course.find({ _id: { $in: allIds } }).select(COURSE_FIELDS).lean(),
    Lesson.find({ course: { $in: allIds } }).select('course date startTime endTime').lean(),
  ]);

  const courseById = new Map(courses.map((c) => [String(c._id), c]));
  const lessonsByCourse = groupByCourse(lessons);

  for (const targetId of targetIds) {
    const target = courseById.get(targetId);
    if (!target) continue;

    // Nunca compara o curso com a própria matrícula
    const enrolledCourses = enrolledIds
      .filter((id) => id !== targetId)
      .map((id) => courseById.get(id))
      .filter(Boolean);
    if (!enrolledCourses.length) continue;

    const targetLessons = resolveLessons(target, lessonsByCourse.get(targetId));
    const conflicts = compareCourses(targetLessons, enrolledCourses, lessonsByCourse);
    if (conflicts.length) result.set(targetId, conflicts);
  }

  return result;
};

// Conflitos de um único curso-alvo. Retorna [] quando não há.
const getScheduleConflicts = async (userId, courseId) => {
  const map = await getConflictsForCourses(userId, [courseId]);
  return map.get(String(courseId)) || [];
};

// 409 padronizado — o front usa `code` e `conflicts`.
const sendScheduleConflict = (res, conflicts, { forStudent = true } = {}) => {
  const names = conflicts.map((c) => c.course.title).join(', ');
  return res.status(409).json({
    success: false,
    code: 'SCHEDULE_CONFLICT',
    message: forStudent
      ? `Você já está inscrito em outro curso que possui atividades neste mesmo horário (${names}). Para participar deste curso, é necessário cancelar sua inscrição no curso conflitante.`
      : `O aluno já está inscrito em outro curso com atividades no mesmo horário (${names}).`,
    conflicts,
  });
};

module.exports = {
  BLOCKING_STATUSES,
  lessonsOverlap,
  compareCourses,
  getConflictsForCourses,
  getScheduleConflicts,
  sendScheduleConflict,
};