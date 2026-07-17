import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Calendar, FileText, Video, FileQuestion, Link as LinkIcon, File, ChevronLeft, ChevronRight, User, MapPin, Clock, Users, FileArchive, Megaphone } from 'lucide-react'
import Header from '../components/layout/Header'
import { Tabs, Spinner, ViewToggle, Badge } from '../components/ui/index'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import MarkdownPreview from '../components/markdown/MarkdownPreview'
import ExerciseRunner from '../components/exercises/ExerciseRunner'
import CertificateTab from '../components/courses/CertificateTab'
import StudentFeedbackTab from '../components/courses/StudentFeedbackTab'
import StudentTestimonial from '../components/courses/StudentTestimonial'
import { STATUS } from '../constants/enrollmentStatus'
import StudentAssessmentsTab from '../components/courses/StudentAssessmentsTab'
import { getCourseAPI, getLessonsAPI, getMaterialsAPI, getMyEnrollmentsAPI } from '../api/courses'
import { getAnnouncementsAPI } from '../api/announcements'
import { getStudentFeedbackAPI } from '../api/feedback'
import { formatDate, parseUTCDate } from '../utils/formatDate'
import { formatModality } from '../utils/formatModality'
import { generateCalendarDays } from '../utils/generateCalendarDays'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { value: 'sobre', label: 'Sobre' },
  { value: 'cronograma', label: 'Cronograma' },
  { value: 'material', label: 'Material' },
  { value: 'avisos', label: 'Avisos' },
  { value: 'notas', label: 'Avaliações' },
]

// A aba "Certificado" só é exibida quando o curso está concluído (closed),
// mas é um destino válido de deep-link das notificações.
const CERTIFICATE_TAB = { value: 'certificado', label: 'Certificado' }
// A aba "Feedback" também só aparece com o curso concluído (destino de deep-link)
const FEEDBACK_TAB = { value: 'feedback', label: 'Feedback' }
const VALID_TABS = [...tabs.map((t) => t.value), CERTIFICATE_TAB.value, FEEDBACK_TAB.value]

// Card de aula reutilizado nas listas de próximas/anteriores.
// isToday → destaque (aula do dia); past → esmaecido; onClick → abre o conteúdo.
const LessonCard = ({ lesson, isToday = false, past = false, onClick }) => {
  const hasContent = !!lesson.content?.trim()
  return (
    <div
      onClick={onClick}
      className={`card p-4 flex gap-4 items-start transition-all ${onClick ? 'cursor-pointer hover:shadow-hover hover:border-primary/40' : ''
        } ${isToday ? 'ring-2 ring-primary border-primary bg-surface-blue' : ''} ${past ? 'opacity-60' : ''}`}
    >
      <div className="w-12 h-12 rounded-card bg-surface-hover flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-primary text-center">
          {parseUTCDate(lesson.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-text-primary text-sm">{lesson.title}</p>
          {isToday && <Badge variant="blue">Hoje</Badge>}
          {hasContent && <Badge variant="success">Conteúdo</Badge>}
        </div>
        <p className="text-xs text-text-muted mt-0.5">{lesson.startTime} – {lesson.endTime} · {lesson.modality}</p>
        {lesson.location && <p className="text-xs text-text-muted">{lesson.location}</p>}
        {lesson.meetingUrl && (
          <a href={lesson.meetingUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary hover:underline block mt-0.5">Acessar aula online</a>
        )}
        {lesson.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{lesson.description}</p>}
      </div>
      {onClick && <ChevronRight size={16} className="text-text-muted flex-shrink-0 self-center" />}
    </div>
  )
}

const StudentCourse = () => {
  const { courseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [materials, setMaterials] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  // Aba inicial pode vir do deep-link da notificação (?tab=avisos|notas|material)
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab')
    return VALID_TABS.includes(t) ? t : 'sobre'
  })
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [lessonsView, setLessonsView] = useState(() => localStorage.getItem('studentCourseLessonsView') || 'list')
  // Filtro do cronograma: 'upcoming' (próximas) ou 'past' (anteriores)
  const [scheduleFilter, setScheduleFilter] = useState('upcoming')
  // Aula aberta para ver o conteúdo / quiz aberto (outra tela)
  const [viewLesson, setViewLesson] = useState(null)
  const [quizLesson, setQuizLesson] = useState(null)
  const [myEnrollment, setMyEnrollment] = useState(null)
  // Existe formulário de feedback (novo) disponível para responder? Define a
  // ordem da aba: com formulário → formulário primeiro e depoimento por último;
  // sem formulário → apenas o depoimento.
  const [hasFeedbackForm, setHasFeedbackForm] = useState(false)

  useEffect(() => {
    if (course?.status !== 'closed') { setHasFeedbackForm(false); return }
    let active = true
    getStudentFeedbackAPI(courseId)
      .then(({ data }) => { if (active) setHasFeedbackForm(!!(data.data?.available && data.data?.form)) })
      .catch(() => { if (active) setHasFeedbackForm(false) })
    return () => { active = false }
  }, [course?.status, courseId])

  const openLesson = (lesson) => setViewLesson(lesson)
  const startQuiz = () => { setQuizLesson(viewLesson); setViewLesson(null) }
  const backToContent = () => { setViewLesson(quizLesson); setQuizLesson(null) }

  const toggleLessonsView = (mode) => {
    setLessonsView(mode)
    localStorage.setItem('studentCourseLessonsView', mode)
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      setLoading(true)
      try {
        const [{ data: cData }, { data: lData }, { data: mData }, { data: eData }, { data: aData }] = await Promise.all([
          getCourseAPI(courseId),
          getLessonsAPI(courseId),
          getMaterialsAPI(courseId),
          getMyEnrollmentsAPI(),
          getAnnouncementsAPI(courseId)
        ])
        if (controller.signal.aborted) return
        setCourse(cData.data)
        setLessons(lData.data)
        setMaterials(mData.data)
        setAnnouncements(aData.data)

        const enrollment = eData.data.find(e => (e.course?._id || e.course) === courseId)
        setMyEnrollment(enrollment || null)
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

  // Deep-link da notificação: se a URL trouxer ?tab=... (inclusive ao clicar
  // outra notificação já estando na página), sincroniza a aba ativa.
  useEffect(() => {
    const t = searchParams.get('tab')
    if (VALID_TABS.includes(t)) setActiveTab(t)
  }, [searchParams])

  // Ao abrir uma notificação já estando no curso, a URL ganha um ?r=<timestamp>
  // que muda a cada clique. Recarrega silenciosamente o conteúdo (materiais,
  // notas e avisos) para a pessoa ver a novidade sem F5. Ignora o load inicial.
  const refreshKey = searchParams.get('r')
  useEffect(() => {
    if (!refreshKey) return
    let active = true
      ; (async () => {
        try {
          const [{ data: cData }, { data: lData }, { data: mData }, { data: aData }, { data: eData }] = await Promise.all([
            getCourseAPI(courseId),
            getLessonsAPI(courseId),
            getMaterialsAPI(courseId),
            getAnnouncementsAPI(courseId),
            getMyEnrollmentsAPI(),
          ])
          if (!active) return
          setCourse(cData.data)
          setLessons(lData.data)
          setMaterials(mData.data)
          setAnnouncements(aData.data)
          setMyEnrollment(eData.data.find(e => (e.course?._id || e.course) === courseId) || null)
        } catch {
          // silencioso: recarregar em background não deve interromper a leitura
        }
      })()
    return () => { active = false }
  }, [refreshKey, courseId])

  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))

  if (loading || !course) return (
    <>
      <div className="flex justify-center p-12"><Spinner /></div>
      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ show: false })} />
    </>
  )

  // Só quem participou do curso (inscrição concluída) vê a aba de feedback.
  // Fila de espera / não-participantes ficam de fora.
  const isCourseParticipant = myEnrollment?.status === STATUS.COMPLETED


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
            <Tabs
              tabs={course?.status === 'closed'
                ? [...tabs, CERTIFICATE_TAB, ...(isCourseParticipant ? [FEEDBACK_TAB] : [])]
                : tabs}
              active={activeTab}
              onChange={setActiveTab}
            />
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

                {/* Lista de aulas — menu para escolher próximas ou anteriores */}
                {lessons.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6">Nenhuma aula cadastrada ainda.</p>
                ) : (() => {
                  const today = new Date(); today.setHours(0, 0, 0, 0)
                  const dayOf = (d) => { const x = parseUTCDate(d); x.setHours(0, 0, 0, 0); return x }
                  const upcoming = lessons
                    .filter(l => dayOf(l.date) >= today)
                    .sort((a, b) => parseUTCDate(a.date) - parseUTCDate(b.date))
                  const past = lessons
                    .filter(l => dayOf(l.date) < today)
                    .sort((a, b) => parseUTCDate(b.date) - parseUTCDate(a.date))
                  const isToday = (l) => dayOf(l.date).getTime() === today.getTime()
                  const containerClass = lessonsView === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                    : 'space-y-3'

                  const list = scheduleFilter === 'upcoming' ? upcoming : past

                  return (
                    <div className="space-y-4">
                      {/* Cabeçalho: seletor próximas/anteriores + alternância lista/cards */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1 p-1 bg-surface-page rounded-lg border border-border">
                          <button
                            type="button"
                            onClick={() => setScheduleFilter('upcoming')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${scheduleFilter === 'upcoming'
                              ? 'bg-white shadow-sm text-primary'
                              : 'text-text-muted hover:text-text-primary'
                              }`}
                          >
                            Próximas{upcoming.length > 0 ? ` (${upcoming.length})` : ''}
                          </button>
                          <button
                            type="button"
                            onClick={() => setScheduleFilter('past')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${scheduleFilter === 'past'
                              ? 'bg-white shadow-sm text-primary'
                              : 'text-text-muted hover:text-text-primary'
                              }`}
                          >
                            Anteriores{past.length > 0 ? ` (${past.length})` : ''}
                          </button>
                        </div>

                        <ViewToggle value={lessonsView} onChange={toggleLessonsView} />
                      </div>

                      {list.length === 0 ? (
                        <p className="text-sm text-text-muted text-center py-6">
                          {scheduleFilter === 'upcoming' ? 'Nenhuma aula futura.' : 'Nenhuma aula anterior.'}
                        </p>
                      ) : (
                        <div className={containerClass}>
                          {list.map(l => (
                            <LessonCard
                              key={l._id}
                              lesson={l}
                              isToday={scheduleFilter === 'upcoming' && isToday(l)}
                              past={scheduleFilter === 'past'}
                              onClick={() => openLesson(l)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
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

            {activeTab === 'avisos' && (
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone size={28} className="mx-auto text-text-muted mb-2 opacity-50" />
                    <p className="text-sm text-text-muted">Nenhum aviso publicado ainda.</p>
                  </div>
                ) : (
                  announcements.map(av => (
                    <div key={av._id} className="card p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-card bg-surface-hover flex items-center justify-center flex-shrink-0 text-primary">
                          <Megaphone size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-text-primary text-sm">{av.title}</h4>
                            {av.audience === 'individual'
                              ? <Badge variant="blue" className="text-[10px]">Para você</Badge>
                              : <Badge variant="gray" className="text-[10px]">Turma</Badge>}
                          </div>
                          <p className="text-sm text-text-secondary mt-1 leading-relaxed whitespace-pre-line">{av.message}</p>
                          <p className="text-[11px] text-text-muted mt-2">
                            {av.author?.name ? `${av.author.name} · ` : ''}{formatDate(av.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'notas' && (
              <StudentAssessmentsTab courseId={courseId} reloadSignal={refreshKey} />
            )}

            {activeTab === 'certificado' && course?.status === 'closed' && (
              <CertificateTab
                courseId={courseId}
                enrollment={myEnrollment}
                course={course}
                lessons={lessons}
                studentName={user?.name}
              />
            )}

            {activeTab === 'feedback' && course?.status === 'closed' && isCourseParticipant && (
              <div className="space-y-6">
                {/* Com formulário (novo): ele vem primeiro; o depoimento fica por último.
                    Sem formulário: aparece apenas o depoimento. */}
                {hasFeedbackForm && (
                  <>
                    <StudentFeedbackTab courseId={courseId} />
                    <div className="h-px bg-border" />
                  </>
                )}
                {/* Depoimento (feedback antigo) — apenas o do próprio aluno */}
                <StudentTestimonial
                  courseId={courseId}
                  user={user}
                  // Depoimento acompanha a liberação da aba: basta ter concluído o
                  // curso (mesma regra do backend). Sem trava extra de situação.
                  canReview={myEnrollment?.status === STATUS.COMPLETED}
                  onNotify={(message) => setToast({ show: true, message })}
                />
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Modal de conteúdo da aula */}
      <Modal open={!!viewLesson} onClose={() => setViewLesson(null)} title={viewLesson?.title || 'Aula'} size="lg">
        {viewLesson && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
              <span className="capitalize">
                {parseUTCDate(viewLesson.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </span>
              <span>{viewLesson.startTime} – {viewLesson.endTime}</span>
              {viewLesson.location && <span>{viewLesson.location}</span>}
            </div>

            {viewLesson.meetingUrl && (
              <a href={viewLesson.meetingUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                <Video size={15} /> Acessar aula online
              </a>
            )}

            <hr className="border-border" />

            {viewLesson.content?.trim() ? (
              <MarkdownPreview content={viewLesson.content} />
            ) : (
              <p className="text-sm text-text-muted italic py-4 text-center">
                O conteúdo desta aula ainda não foi publicado.
              </p>
            )}

            {/* Exercícios (autoavaliação) — abrem em outra tela */}
            {viewLesson.exercises?.length > 0 && (
              <div className="pt-2 border-t border-border">
                <button onClick={startQuiz} className="btn-primary w-full">
                  <FileQuestion size={16} /> Fazer exercício ({viewLesson.exercises.length} {viewLesson.exercises.length === 1 ? 'questão' : 'questões'})
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal do quiz (uma questão por vez) */}
      <Modal open={!!quizLesson} onClose={backToContent} title={`Exercícios — ${quizLesson?.title || 'Aula'}`} size="lg">
        {quizLesson && <ExerciseRunner questions={quizLesson.exercises} onExit={backToContent} />}
      </Modal>
    </div>
  )
}

export default StudentCourse