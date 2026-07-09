// Lógica de conflito de horário no cliente — espelha o backend
// (helpers/scheduleConflicts.js). Duas aulas conflitam quando caem no mesmo dia
// da semana, com horários que se sobrepõem, e os cursos rodam em períodos que
// se cruzam.

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
// Ordem de exibição: começa na segunda, domingo por último
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export const timeToMinutes = (t) => {
  const [h, m] = String(t || '').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Dia da semana em UTC (bate com a geração das aulas no backend)
export const weekdayOf = (date) => new Date(date).getUTCDay()

export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd

const dayNum = (d) => {
  const x = new Date(d)
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate())
}

export const dateRangesOverlap = (aStart, aEnd, bStart, bEnd) =>
  dayNum(aStart) <= dayNum(bEnd) && dayNum(bStart) <= dayNum(aEnd)

const lessonsClash = (a, b) =>
  weekdayOf(a.date) === weekdayOf(b.date) &&
  rangesOverlap(
    timeToMinutes(a.startTime), timeToMinutes(a.endTime),
    timeToMinutes(b.startTime), timeToMinutes(b.endTime)
  )

// Detecta conflitos num conjunto de aulas.
// courseById: Map<id, { _id, title, startDate, endDate }>.
// Retorna { conflictIds:Set<lessonKey>, pairs:[{ a, b, slots:[{weekday,startTime,endTime}] }] }.
// lessonKey = `${courseId}-${date}-${startTime}` (estável para marcar blocos).
export const lessonKey = (l) => `${l.course}-${l.date}-${l.startTime}-${l.endTime}`

export const detectConflicts = (lessons, courseById) => {
  const conflictIds = new Set()
  const pairMap = new Map()

  for (let i = 0; i < lessons.length; i++) {
    for (let j = i + 1; j < lessons.length; j++) {
      const a = lessons[i]
      const b = lessons[j]
      if (String(a.course) === String(b.course)) continue
      if (!lessonsClash(a, b)) continue

      const ca = courseById.get(String(a.course))
      const cb = courseById.get(String(b.course))
      if (ca && cb && !dateRangesOverlap(ca.startDate, ca.endDate, cb.startDate, cb.endDate)) continue

      conflictIds.add(lessonKey(a))
      conflictIds.add(lessonKey(b))

      const pairKey = [String(a.course), String(b.course)].sort().join('|')
      if (!pairMap.has(pairKey)) {
        pairMap.set(pairKey, { a: ca, b: cb, slots: new Map() })
      }
      const weekday = weekdayOf(a.date)
      const slotKey = `${weekday}-${a.startTime}-${a.endTime}`
      pairMap.get(pairKey).slots.set(slotKey, { weekday, startTime: a.startTime, endTime: a.endTime })
    }
  }

  const pairs = [...pairMap.values()].map(p => ({
    a: p.a,
    b: p.b,
    slots: [...p.slots.values()].sort((x, y) => x.weekday - y.weekday || timeToMinutes(x.startTime) - timeToMinutes(y.startTime)),
  }))

  return { conflictIds, pairs }
}

// Chave de dia (UTC) — bate com a forma como as aulas são armazenadas
export const dateKey = (d) => {
  const x = new Date(d)
  return `${x.getUTCFullYear()}-${x.getUTCMonth()}-${x.getUTCDate()}`
}

// Conflitos numa visão mensal, restritos à AGENDA DO ALUNO: só marca choque
// quando os DOIS cursos são cursos em que a pessoa está inscrita (mySet).
// Assim o calendário só alerta sobre conflitos que afetam a agenda dela — não
// sobre conflitos entre cursos quaisquer. Sem mySet (deslogado / sem inscrição)
// não há conflitos a exibir.
export const detectDateConflicts = (lessons, mySet) => {
  const conflictIds = new Set()
  if (!mySet || mySet.size === 0) return conflictIds

  const byDate = new Map()
  for (const l of lessons) {
    if (!mySet.has(String(l.course))) continue // só as aulas dos meus cursos
    const k = dateKey(l.date)
    if (!byDate.has(k)) byDate.set(k, [])
    byDate.get(k).push(l)
  }
  for (const group of byDate.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j]
        if (String(a.course) === String(b.course)) continue
        if (rangesOverlap(
          timeToMinutes(a.startTime), timeToMinutes(a.endTime),
          timeToMinutes(b.startTime), timeToMinutes(b.endTime)
        )) {
          conflictIds.add(lessonKey(a))
          conflictIds.add(lessonKey(b))
        }
      }
    }
  }
  return conflictIds
}

// Paleta estável de cores por curso (para blocos e legenda)
const PALETTE = [
  '#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#00838F',
  '#AD1457', '#4527A0', '#00695C', '#EF6C00', '#283593',
]

export const colorForCourse = (courseId, index) =>
  PALETTE[(index >= 0 ? index : Math.abs(hashStr(String(courseId)))) % PALETTE.length]

const hashStr = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
