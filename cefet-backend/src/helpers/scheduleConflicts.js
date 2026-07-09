// Detecção de conflito de horário entre aulas de cursos diferentes.
// Duas aulas conflitam quando caem no MESMO dia da semana, com faixas de
// horário que se sobrepõem e cujos cursos rodam em períodos que se cruzam.
// (mesma lógica espelhada no frontend em utils/scheduleConflicts.js)

const timeToMinutes = (t) => {
  const [h, m] = String(t || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Sobreposição de intervalos [aStart, aEnd) e [bStart, bEnd)
const rangesOverlap = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && bStart < aEnd;

// Dia da semana (0=Dom … 6=Sáb) — usa UTC para bater com a geração das aulas
const weekdayOf = (date) => new Date(date).getUTCDay();

// Períodos de dois cursos se cruzam (comparando só a data, ignorando hora)
const dateRangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  const day = (d) => {
    const x = new Date(d);
    return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
  };
  return day(aStart) <= day(bEnd) && day(bStart) <= day(aEnd);
};

// Duas aulas conflitam?
const lessonsConflict = (a, b) =>
  weekdayOf(a.date) === weekdayOf(b.date) &&
  rangesOverlap(
    timeToMinutes(a.startTime), timeToMinutes(a.endTime),
    timeToMinutes(b.startTime), timeToMinutes(b.endTime)
  );

// Encontra os choques entre as aulas do curso-alvo e as de outros cursos.
// targetCourse/otherCourses precisam de { _id, title, startDate, endDate }.
// lessonsByCourse: Map<courseId, lesson[]>.
// Retorna [{ course: { _id, title }, slots: [{ weekday, startTime, endTime }] }].
const findConflicts = (targetCourse, targetLessons, otherCourses, lessonsByCourse) => {
  const out = [];

  for (const other of otherCourses) {
    if (String(other._id) === String(targetCourse._id)) continue;
    if (!dateRangesOverlap(targetCourse.startDate, targetCourse.endDate, other.startDate, other.endDate))
      continue;

    const otherLessons = lessonsByCourse.get(String(other._id)) || [];
    const slots = new Map(); // dedupe por weekday+horário

    for (const tl of targetLessons) {
      for (const ol of otherLessons) {
        if (lessonsConflict(tl, ol)) {
          const weekday = weekdayOf(ol.date);
          const key = `${weekday}-${ol.startTime}-${ol.endTime}`;
          if (!slots.has(key))
            slots.set(key, { weekday, startTime: ol.startTime, endTime: ol.endTime });
        }
      }
    }

    if (slots.size > 0)
      out.push({ course: { _id: other._id, title: other.title }, slots: [...slots.values()] });
  }

  return out;
};

module.exports = {
  timeToMinutes,
  rangesOverlap,
  weekdayOf,
  dateRangesOverlap,
  lessonsConflict,
  findConflicts,
};
