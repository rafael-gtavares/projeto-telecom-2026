import { Edit2, Trash2, FileText, FileQuestion, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge, ViewToggle } from '../../ui/index'
import { formatDate, parseUTCDate } from '../../../utils/formatDate'
import { generateCalendarDays } from '../../../utils/generateCalendarDays'

const LessonsTab = ({
  course,
  lessons,
  calendarDate,
  selectedCalendarDay,
  lessonsView,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onToggleView,
  onOpenContent,
  onOpenExercises,
  onEditLesson,
  onDeleteLesson,
}) => (
  <div className="p-4 md:p-6 space-y-6">

    {/* As aulas são geradas automaticamente pelo cronograma do curso
        (tipo de agenda). Aqui só é possível ajustar/excluir as existentes. */}

    {/* Período do curso */}
    <div className="grid grid-cols-2 gap-4 p-3 bg-surface-page rounded-card">
      <div>
        <p className="text-xs text-text-muted mb-0.5">Início do curso</p>
        <p className="text-sm font-semibold text-text-primary">{formatDate(course.startDate)}</p>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-0.5">Término do curso</p>
        <p className="text-sm font-semibold text-text-primary">{formatDate(course.endDate)}</p>
      </div>
    </div>

    <div className="card p-0 overflow-hidden">
      {/* Header do mês */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-page">
        <button onClick={onPrevMonth} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold text-text-primary capitalize text-sm">
          {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={onNextMonth} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid */}
      <div className="p-3">
        <div className="grid grid-cols-7 text-center mb-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-[10px] font-bold text-text-muted uppercase py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {generateCalendarDays(calendarDate, lessons).map(({ day, date, lessonCount }, idx) => {
            const today = day && date?.toDateString() === new Date().toDateString()
            const isSelected = day && selectedCalendarDay?.toDateString() === date?.toDateString()
            const hasLessons = lessonCount > 0
            // Comparação UTC-safe: parseUTCDate garante que course.startDate/endDate
            // sejam interpretadas como datas locais, igual ao que já é feito nas listas.
            const isStart = day && course.startDate && date?.toDateString() === parseUTCDate(course.startDate).toDateString()
            const isEnd = day && course.endDate && date?.toDateString() === parseUTCDate(course.endDate).toDateString()
            const isMilestone = isStart || isEnd

            return (
              <div key={idx}
                onClick={() => day && (hasLessons || isMilestone) && onSelectDay(isSelected ? null : date)}
                className={`
                  flex flex-col items-center justify-start py-1.5 rounded-xl text-sm transition-all select-none
                  ${!day ? '' : (hasLessons || isMilestone) ? 'cursor-pointer' : 'cursor-default'}
                  ${isSelected
                    ? 'bg-primary'
                    : isStart && isEnd
                      ? 'bg-success/15 ring-2 ring-inset ring-success/40'
                      : isStart
                        ? 'bg-success/15 ring-2 ring-inset ring-success/50'
                        : isEnd
                          ? 'bg-warning/15 ring-2 ring-inset ring-warning/50'
                          : today
                            ? 'bg-surface-blue'
                            : hasLessons
                              ? 'hover:bg-surface-hover'
                              : ''}
                `}
              >
                <span className={`font-semibold leading-none text-sm ${isSelected ? 'text-white'
                  : isStart && isEnd ? 'text-success'
                    : isStart ? 'text-success'
                      : isEnd ? 'text-warning'
                        : today ? 'text-primary'
                          : 'text-text-primary'
                  } ${!day ? 'invisible' : ''}`}>
                  {day || '0'}
                </span>
                {(hasLessons || isMilestone) && (
                  <div className="flex gap-0.5 mt-1 items-center justify-around">
                    {hasLessons && Array.from({ length: Math.min(lessonCount, 3) }).map((_, i) => (
                      <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-primary'}`} />
                    ))}
                    {isStart && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-success" title="Início do curso" />
                    )}
                    {isEnd && !isStart && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-warning" title="Término do curso" />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-10 mt-3 pt-3 border-t border-border justify-center">
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Aulas
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="w-2 h-2 rounded-full bg-success inline-block" /> Início
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="w-2 h-2 rounded-full bg-warning inline-block" /> Término
          </span>
        </div>
      </div>

      {/* Painel do dia selecionado */}
      {selectedCalendarDay && (() => {
        const dayLessons = lessons.filter(l =>
          parseUTCDate(l.date).toDateString() === selectedCalendarDay.toDateString()
        )
        const dayIsStart = course.startDate && selectedCalendarDay.toDateString() === parseUTCDate(course.startDate).toDateString()
        const dayIsEnd = course.endDate && selectedCalendarDay.toDateString() === parseUTCDate(course.endDate).toDateString()
        return (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
            <p className="text-xs font-bold text-text-muted uppercase">
              {selectedCalendarDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            {/* Marcadores de início / término */}
            {dayIsStart && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                <p className="text-xs font-semibold text-success">Início do curso</p>
              </div>
            )}
            {dayIsEnd && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
                <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                <p className="text-xs font-semibold text-warning">Término do curso</p>
              </div>
            )}

            {dayLessons.map(lesson => (
              <div key={lesson._id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-hover border border-border">
                <div className="flex-shrink-0 w-10 text-center">
                  <p className="text-[10px] font-bold text-primary uppercase">{lesson.startTime}</p>
                  <div className="w-px h-3 bg-primary/30 mx-auto my-0.5" />
                  <p className="text-[10px] text-text-muted">{lesson.endTime}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{lesson.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant={lesson.modality === 'online' ? 'blue' : 'gray'} className="text-[10px]">
                      {lesson.modality}
                    </Badge>
                    {lesson.location && <span className="text-[10px] text-text-muted">{lesson.location}</span>}
                    {lesson.meetingUrl && (
                      <a href={lesson.meetingUrl} target="_blank" rel="noreferrer"
                        className="text-[10px] text-primary hover:underline" onClick={e => e.stopPropagation()}>
                        Link da aula
                      </a>
                    )}
                  </div>
                  {lesson.description && <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">{lesson.description}</p>}
                </div>
                <button onClick={() => onEditLesson(lesson)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-white transition-colors flex-shrink-0">
                  <Edit2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )
      })()}
    </div>

    {/* Lista de todas as aulas */}
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-text-primary">Todas as aulas</h3>
        {lessons.length > 0 && <ViewToggle value={lessonsView} onChange={onToggleView} />}
      </div>
      {lessons.length === 0 ? (
        <div className="text-center py-10 text-text-muted text-sm">Nenhuma aula cadastrada ainda.</div>
      ) : lessonsView === 'list' ? (
        /* ── MODO LISTA ── */
        lessons.map(lesson => (
          <div key={lesson._id} className="card p-4 flex gap-4 items-start">
            <div className="text-center w-12 h-12 rounded-card bg-surface-hover flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {parseUTCDate(lesson.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-text-primary text-sm">{lesson.title}</h4>
              <div className="flex flex-wrap gap-3 mt-1">
                <span className="text-xs text-text-muted">{lesson.startTime} – {lesson.endTime}</span>
                <Badge variant={lesson.modality === 'online' ? 'blue' : 'gray'}>
                  {lesson.modality}
                </Badge>
                {lesson.location && <span className="text-xs text-text-muted">{lesson.location}</span>}
              </div>
              {lesson.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{lesson.description}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onOpenContent(lesson)} title="Conteúdo da aula"
                className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                <FileText size={14} />
              </button>
              <button onClick={() => onOpenExercises(lesson)} title="Exercícios da aula"
                className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                <FileQuestion size={14} />
              </button>
              <button onClick={() => onEditLesson(lesson)} title="Editar aula"
                className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDeleteLesson(lesson._id)} title="Excluir aula"
                className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      ) : (
        /* ── MODO GRID (CARDS) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lessons.map(lesson => (
            <div key={lesson._id} className="card p-4 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="text-center w-12 h-12 rounded-card bg-surface-hover flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {parseUTCDate(lesson.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text-primary text-sm leading-tight">{lesson.title}</h4>
                  <span className="text-xs text-text-muted">{lesson.startTime} – {lesson.endTime}</span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => onOpenContent(lesson)} title="Conteúdo da aula"
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                    <FileText size={14} />
                  </button>
                  <button onClick={() => onOpenExercises(lesson)} title="Exercícios da aula"
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                    <FileQuestion size={14} />
                  </button>
                  <button onClick={() => onEditLesson(lesson)} title="Editar aula"
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDeleteLesson(lesson._id)} title="Excluir aula"
                    className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant={lesson.modality === 'online' ? 'blue' : 'gray'}>
                  {lesson.modality}
                </Badge>
                {lesson.location && <span className="text-xs text-text-muted">{lesson.location}</span>}
              </div>
              {lesson.description && <p className="text-xs text-text-secondary mt-2 line-clamp-2">{lesson.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)

export default LessonsTab
