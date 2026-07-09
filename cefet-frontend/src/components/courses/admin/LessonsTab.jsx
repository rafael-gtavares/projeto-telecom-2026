import { Edit2, Trash2, FileText, FileQuestion } from 'lucide-react'
import { Badge, ViewToggle } from '../../ui/index'
import { formatDate, parseUTCDate } from '../../../utils/formatDate'
import CalendarGrid from '../../ui/CalendarGrid'

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

    <CalendarGrid
      course={course}
      lessons={lessons}
      calendarDate={calendarDate}
      selectedDay={selectedCalendarDay}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
      onSelectDay={onSelectDay}
    />

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
