import { useState, useEffect, useMemo, useRef } from 'react'
import { CalendarDays, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Eye, EyeOff, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getCalendarAPI } from '../../api/calendar'
import { generateCalendarDays } from '../../utils/generateCalendarDays'
import {
  timeToMinutes, detectDateConflicts, lessonKey, colorForCourse,
} from '../../utils/scheduleConflicts'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MAX_CHIPS = 3   // aulas mostradas por célula antes do "+N"

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const sortByTime = (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)

const ScheduleCalendar = () => {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState({ courses: [], lessons: [], myCourseIds: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [hidden, setHidden] = useState(() => new Set())
  const [monthDate, setMonthDate] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState(null)
  const didInit = useRef(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    getCalendarAPI()
      .then((r) => { if (active) { setData(r.data.data); setError('') } })
      .catch(() => { if (active) setError('Não foi possível carregar a agenda.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isAuthenticated])

  useEffect(() => { if (!isAuthenticated) setOnlyMine(false) }, [isAuthenticated])

  const mySet = useMemo(() => new Set(data.myCourseIds.map(String)), [data.myCourseIds])

  const colorIndex = useMemo(() => {
    const idx = new Map()
    ;[...data.courses]
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach((c, i) => idx.set(String(c._id), i))
    return idx
  }, [data.courses])

  const courseById = useMemo(
    () => new Map(data.courses.map((c) => [String(c._id), c])),
    [data.courses]
  )

  const colorOf = (courseId) => colorForCourse(courseId, colorIndex.get(String(courseId)) ?? -1)
  const titleOf = (courseId) => courseById.get(String(courseId))?.title || 'Aula'

  const visibleLessons = useMemo(() => {
    return data.lessons.filter((l) => {
      const cid = String(l.course)
      if (onlyMine && !mySet.has(cid)) return false
      if (hidden.has(cid)) return false
      return true
    })
  }, [data.lessons, onlyMine, mySet, hidden])

  // Conflitos só entre os cursos em que a pessoa está inscrita (afetam a agenda dela)
  const conflictIds = useMemo(() => detectDateConflicts(visibleLessons, mySet), [visibleLessons, mySet])

  // Na primeira carga, pula para o mês da próxima aula (ou da mais recente)
  useEffect(() => {
    if (didInit.current || data.lessons.length === 0) return
    didInit.current = true
    const today = new Date()
    const times = data.lessons.map((l) => new Date(l.date).getTime()).sort((a, b) => a - b)
    const future = times.find((t) => t >= today.setHours(0, 0, 0, 0))
    const target = new Date(future ?? times[0])
    setMonthDate(new Date(target.getUTCFullYear(), target.getUTCMonth(), 1))
  }, [data.lessons])

  const cells = useMemo(
    () => generateCalendarDays(monthDate, visibleLessons),
    [monthDate, visibleLessons]
  )

  const goPrev = () => { setSelectedDay(null); setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  const goNext = () => { setSelectedDay(null); setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }
  const goToday = () => {
    const n = new Date()
    setSelectedDay(null)
    setMonthDate(new Date(n.getFullYear(), n.getMonth(), 1))
  }

  const toggleHidden = (courseId) => {
    setHidden((prev) => {
      const next = new Set(prev)
      const id = String(courseId)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const legendCourses = useMemo(() => {
    return [...data.courses]
      .filter((c) => !onlyMine || mySet.has(String(c._id)))
      .sort((a, b) => (colorIndex.get(String(a._id)) ?? 0) - (colorIndex.get(String(b._id)) ?? 0))
  }, [data.courses, onlyMine, mySet, colorIndex])

  const conflictDaysInMonth = useMemo(
    () => cells.filter((c) => c.day && (c.lessons || []).some((l) => conflictIds.has(lessonKey(l)))).length,
    [cells, conflictIds]
  )

  const todayStr = new Date().toDateString()
  const selectedLessons = selectedDay
    ? [...(cells.find((c) => c.date && c.date.toDateString() === selectedDay)?.lessons || [])].sort(sortByTime)
    : []

  return (
    <div className="card p-5 md:p-6">
      {/* Cabeçalho + controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center">
            <CalendarDays size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary leading-tight">Calendário de aulas</h3>
            <p className="text-xs text-text-muted">Horários de todos os cursos — navegue pelos meses e veja conflitos</p>
          </div>
        </div>

        {isAuthenticated && mySet.size > 0 && (
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface-page self-start">
            {[
              { key: false, label: 'Todos os cursos' },
              { key: true, label: 'Meus cursos' },
            ].map((opt) => (
              <button
                key={String(opt.key)}
                onClick={() => setOnlyMine(opt.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  onlyMine === opt.key ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={goPrev} className="p-2 rounded-lg hover:bg-surface-hover transition-colors" aria-label="Mês anterior">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-text-primary capitalize">
            {cap(monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))}
          </span>
          <button onClick={goToday} className="text-xs font-semibold text-primary hover:underline">Hoje</button>
        </div>
        <button onClick={goNext} className="p-2 rounded-lg hover:bg-surface-hover transition-colors" aria-label="Próximo mês">
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-error text-center py-10">{error}</p>
      ) : (
        <>
          {conflictDaysInMonth > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-text font-medium">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {conflictDaysInMonth === 1
                ? '1 dia com conflito de horário neste mês'
                : `${conflictDaysInMonth} dias com conflito de horário neste mês`}
            </div>
          )}

          {/* Grade mensal */}
          <div className="grid grid-cols-7 text-center mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-[10px] font-bold text-text-muted uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell.day) return <div key={idx} className="min-h-[68px] md:min-h-[92px]" />
              const dayLessons = [...(cell.lessons || [])].sort(sortByTime)
              const isToday = cell.date.toDateString() === todayStr
              const isSelected = selectedDay === cell.date.toDateString()
              const hasConflict = dayLessons.some((l) => conflictIds.has(lessonKey(l)))
              const hasLessons = dayLessons.length > 0
              return (
                <button
                  key={idx}
                  onClick={() => hasLessons && setSelectedDay(isSelected ? null : cell.date.toDateString())}
                  className={`min-h-[68px] md:min-h-[92px] rounded-lg border p-1 md:p-1.5 flex flex-col text-left transition-colors ${
                    hasLessons ? 'cursor-pointer hover:border-primary/50' : 'cursor-default'
                  } ${
                    isSelected ? 'border-primary bg-surface-blue'
                      : hasConflict ? 'border-error/40 bg-error/[0.03]'
                        : isToday ? 'border-primary/40 bg-surface-page'
                          : 'border-border bg-white'
                  }`}
                >
                  <span className={`text-[11px] md:text-xs font-semibold leading-none mb-1 flex items-center gap-1 ${
                    isToday ? 'text-primary' : 'text-text-secondary'
                  }`}>
                    {cell.day}
                    {hasConflict && <AlertTriangle size={10} className="text-error" />}
                  </span>

                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {dayLessons.slice(0, MAX_CHIPS).map((l) => {
                      const conflicted = conflictIds.has(lessonKey(l))
                      return (
                        <div
                          key={lessonKey(l)}
                          title={`${titleOf(l.course)} · ${l.startTime}–${l.endTime}${conflicted ? '  ⚠ conflito' : ''}`}
                          className="flex items-center gap-1 rounded px-1 py-0.5 text-white text-[9px] md:text-[10px] leading-tight"
                          style={{
                            backgroundColor: colorOf(l.course),
                            outline: conflicted ? '1.5px solid #C62828' : 'none',
                            outlineOffset: '-1.5px',
                          }}
                        >
                          <span className="font-semibold tabular-nums hidden md:inline">{l.startTime}</span>
                          <span className="truncate">{titleOf(l.course)}</span>
                        </div>
                      )
                    })}
                    {dayLessons.length > MAX_CHIPS && (
                      <div className="text-[9px] md:text-[10px] text-text-muted font-medium px-1">
                        +{dayLessons.length - MAX_CHIPS} mais
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Painel do dia selecionado */}
          {selectedDay && selectedLessons.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border animate-fadeIn">
              <p className="text-xs font-bold text-text-muted uppercase mb-2">
                {new Date(selectedDay).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="space-y-2">
                {selectedLessons.map((l) => {
                  const conflicted = conflictIds.has(lessonKey(l))
                  return (
                    <div
                      key={lessonKey(l)}
                      className={`flex items-start gap-3 p-3 rounded-xl border ${
                        conflicted ? 'border-error/30 bg-error/5' : 'border-border bg-surface-hover'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: colorOf(l.course) }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-text-primary truncate">{titleOf(l.course)}</p>
                          {mySet.has(String(l.course)) && (
                            <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1 py-px">meu</span>
                          )}
                          {conflicted && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-error bg-error/10 rounded px-1 py-px">
                              <AlertTriangle size={9} /> conflito
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {l.startTime} – {l.endTime}
                          {l.location ? <span className="inline-flex items-center gap-1 ml-2"><MapPin size={11} /> {l.location}</span> : null}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Legenda */}
          {legendCourses.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {legendCourses.map((c) => {
                  const isHidden = hidden.has(String(c._id))
                  const mine = mySet.has(String(c._id))
                  return (
                    <button
                      key={c._id}
                      onClick={() => toggleHidden(c._id)}
                      className={`inline-flex items-center gap-1.5 text-xs transition-opacity ${isHidden ? 'opacity-40' : ''}`}
                      title={isHidden ? 'Mostrar no calendário' : 'Ocultar do calendário'}
                    >
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: colorOf(c._id) }} />
                      <span className="text-text-secondary font-medium max-w-[180px] truncate">{c.title}</span>
                      {mine && <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1 py-px">meu</span>}
                      {isHidden ? <EyeOff size={11} className="text-text-muted" /> : <Eye size={11} className="text-text-muted" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ScheduleCalendar
