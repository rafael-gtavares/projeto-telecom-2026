import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Calendar, FileText, Video, FileQuestion, Link as LinkIcon, File, ChevronLeft, ChevronRight, User, MapPin, Clock, Users, FileArchive} from 'lucide-react'
import Header from '../components/layout/Header'
import { Tabs, Spinner, ViewToggle } from '../components/ui/index'
import Toast from '../components/ui/Toast'
import { getCourseAPI, getLessonsAPI, getMaterialsAPI, getMyGradesAPI } from '../api/courses'
import { formatDate, parseUTCDate } from '../utils/formatDate'
import { formatModality } from '../utils/formatModality'
import { generateCalendarDays } from '../utils/generateCalendarDays'

const tabs = [
  { value: 'sobre', label: 'Sobre' },
  { value: 'cronograma', label: 'Cronograma' },
  { value: 'material', label: 'Material' },
  { value: 'notas', label: 'Minhas notas' },
]

const StudentCourse = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [materials, setMaterials] = useState([])
  const [myGrades, setMyGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sobre')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [lessonsView, setLessonsView] = useState(() => localStorage.getItem('studentCourseLessonsView') || 'list')

  const toggleLessonsView = (mode) => {
    setLessonsView(mode)
    localStorage.setItem('studentCourseLessonsView', mode)
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      setLoading(true)
      try {
        const [{ data: cData }, { data: lData }, { data: mData }, { data: gData }] = await Promise.all([
          getCourseAPI(courseId),
          getLessonsAPI(courseId),
          getMaterialsAPI(courseId),
          getMyGradesAPI(courseId)
        ])
        if (controller.signal.aborted) return
        setCourse(cData.data)
        setLessons(lData.data)
        setMaterials(mData.data)
        setMyGrades(gData.data)
      } catch (err) {
        if (controller.signal.aborted) return
        if (err.response?.status === 403) {
          setToast({ show: true, message: 'Você não tem acesso a este curso.' })
          setTimeout(() => navigate('/meus-cursos'), 1500)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [courseId])

  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))

  if (loading || !course) return (
    <>
      <div className="flex justify-center p-12"><Spinner /></div>
      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ show: false })} />
    </>
  )

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <div className="page-container">
        <div className="max-w-3xl mx-auto px-4 py-6">

          <button onClick={() => navigate('/meus-cursos')}
            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4 text-sm font-medium">
            <ArrowLeft size={16} /> Meus Cursos
          </button>

          <div className="relative w-full h-40 rounded-card overflow-hidden mb-4">
            {course.imageUrl
              ? <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light" />
            }
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-end p-4">
              <h1 className="text-white font-bold text-lg leading-tight">{course?.title}</h1>
            </div>
          </div>

          <div className="border-b border-border bg-white rounded-t-card px-4">
            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="bg-white rounded-b-card border border-border border-t-0 p-4">

            {activeTab === 'sobre' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Descrição</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {course.description || 'Nenhuma descrição disponível.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-page rounded-card space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1">
                      <User size={12} /> Instrutor
                    </span>
                    <p className="text-sm font-semibold text-text-primary">
                      {course.instructor || course.professor?.name || 'A definir'}
                    </p>
                  </div>

                  <div className="p-3 bg-surface-page rounded-card space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1">
                      <Clock size={12} /> Modalidade
                    </span>
                    <p className="text-sm font-semibold text-text-primary">
                      {formatModality(course.modality)}
                    </p>
                  </div>

                  <div className="p-3 bg-surface-page rounded-card space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1">
                      <Calendar size={12} /> Período
                    </span>
                    <p className="text-sm font-semibold text-text-primary">
                      {formatDate(course.startDate)} → {formatDate(course.endDate)}
                    </p>
                  </div>

                  {course.location && (
                    <div className="p-3 bg-surface-page rounded-card space-y-1">
                      <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1">
                        <MapPin size={12} /> Local
                      </span>
                      <p className="text-sm font-semibold text-text-primary">{course.location}</p>
                    </div>
                  )}

                  <div className="p-3 bg-surface-page rounded-card space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1">
                      <Users size={12} /> Vagas
                    </span>
                    <p className="text-sm font-semibold text-text-primary">
                      {course.enrolledCount}/{course.maxSlots} inscritos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cronograma' && (
              <div className="space-y-4">
                {/* Período do curso */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-surface-page rounded-card">
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Início do curso</p>
                    <p className="text-sm font-semibold text-text-primary">{formatDate(course?.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Término do curso</p>
                    <p className="text-sm font-semibold text-text-primary">{formatDate(course?.endDate)}</p>
                  </div>
                </div>

                {/* Calendário */}
                <div className="card p-0 overflow-hidden">
                  {/* Header do mês */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-page">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-semibold text-text-primary capitalize text-sm">
                      {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Grid de dias */}
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
                        // Comparação UTC-safe: parseUTCDate interpreta course.startDate/endDate
                        // como data local, evitando o desvio de fuso horário.
                        const isStart = day && course.startDate && date?.toDateString() === parseUTCDate(course.startDate).toDateString()
                        const isEnd = day && course.endDate && date?.toDateString() === parseUTCDate(course.endDate).toDateString()
                        const isMilestone = isStart || isEnd

                        return (
                          <div
                            key={idx}
                            onClick={() => day && (hasLessons || isMilestone) && setSelectedCalendarDay(isSelected ? null : date)}
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
                              <div className="flex gap-0.5 mt-1 items-center">
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
                    <div className="flex flex-wrap gap-8 mt-3 pt-3 border-t border-border justify-center">
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
                              <p className="text-[11px] text-text-muted mt-0.5">{lesson.modality}{lesson.location ? ` · ${lesson.location}` : ''}</p>
                              {lesson.meetingUrl && (
                                <a href={lesson.meetingUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-[11px] text-primary hover:underline mt-0.5 block">
                                  Acessar aula online
                                </a>
                              )}
                              {lesson.description && <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">{lesson.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                {/* Lista de todas as aulas */}
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-text-primary text-sm">Todas as aulas</h3>
                  {lessons.length > 0 && <ViewToggle value={lessonsView} onChange={toggleLessonsView} />}
                </div>
                {lessons.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6">Nenhuma aula cadastrada ainda.</p>
                ) : lessonsView === 'list' ? (
                  /* ── MODO LISTA ── */
                  lessons.map(lesson => (
                    <div key={lesson._id} className="card p-4 flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-card bg-surface-hover flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary text-center">
                          {parseUTCDate(lesson.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary text-sm">{lesson.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">{lesson.startTime} – {lesson.endTime} · {lesson.modality}</p>
                        {lesson.location && <p className="text-xs text-text-muted">{lesson.location}</p>}
                        {lesson.meetingUrl && (
                          <a href={lesson.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline block mt-0.5">Acessar aula online</a>
                        )}
                        {lesson.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{lesson.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  /* ── MODO GRID (CARDS) ── */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lessons.map(lesson => (
                      <div key={lesson._id} className="card p-4 flex flex-col">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-card bg-surface-hover flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary text-center">
                              {parseUTCDate(lesson.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-text-primary text-sm leading-tight">{lesson.title}</p>
                            <p className="text-xs text-text-muted mt-0.5">{lesson.startTime} – {lesson.endTime} · {lesson.modality}</p>
                          </div>
                        </div>
                        {lesson.location && <p className="text-xs text-text-muted mt-2">{lesson.location}</p>}
                        {lesson.meetingUrl && (
                          <a href={lesson.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline block mt-1">Acessar aula online</a>
                        )}
                        {lesson.description && <p className="text-xs text-text-secondary mt-2 line-clamp-2">{lesson.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'material' && (
              <div className="space-y-3">
                {materials.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={28} className="mx-auto text-text-muted mb-2 opacity-50" />
                    <p className="text-sm text-text-muted">Nenhum material disponível ainda.</p>
                  </div>
                ) : (
                  materials.map(mat => {
                    const typeIcon = {
                      text: <BookOpen size={16} />,
                      link: <LinkIcon size={16} />,
                      file: <FileArchive size={16} />
                    }[mat.type] || <BookOpen size={16} />

                    return (
                      <div key={mat._id} className="card p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-card bg-surface-hover flex items-center justify-center flex-shrink-0 text-primary">
                            {typeIcon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-text-primary text-sm">{mat.title}</h4>
                            {mat.description && <p className="text-xs text-text-secondary mt-0.5">{mat.description}</p>}
                            {mat.type === 'text' && mat.content && (
                              <div className="mt-2 p-3 bg-surface-page rounded-lg text-sm text-text-secondary leading-relaxed max-h-48 overflow-y-auto">
                                {mat.content}
                              </div>
                            )}
                            {['file', 'link'].includes(mat.type) && mat.content && (
                              <a href={mat.content} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary font-medium hover:underline">
                                Acessar material →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {activeTab === 'notas' && (
              <div className="space-y-3">
                {myGrades.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-text-muted">Nenhuma nota lançada ainda.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-surface-blue rounded-card text-center mb-4">
                      <p className="text-xs text-text-muted mb-1">Média geral</p>
                      <p className="text-3xl font-bold text-primary">
                        {(myGrades.reduce((acc, g) => acc + g.grade, 0) / myGrades.length).toFixed(1)}
                      </p>
                    </div>

                    {myGrades.map(g => (
                      <div key={g._id} className="flex items-center gap-4 p-3 card">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm">{g.title}</p>
                          <p className="text-xs text-text-muted capitalize">{g.type}</p>
                          {g.feedback && <p className="text-xs text-text-secondary mt-1 italic">"{g.feedback}"</p>}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-xl font-bold text-primary">{g.grade}</span>
                          <span className="text-text-muted text-xs">/{g.maxGrade}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentCourse