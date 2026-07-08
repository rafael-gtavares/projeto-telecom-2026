import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Calendar, FileText, Video, FileQuestion, Link as LinkIcon, File, ChevronLeft, ChevronRight, User, MapPin, Clock, Users, FileArchive, Megaphone, Star, Trash2, Plus } from 'lucide-react'
import Header from '../components/layout/Header'
import { Tabs, Spinner, ViewToggle, Badge } from '../components/ui/index'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import MarkdownPreview from '../components/markdown/MarkdownPreview'
import ExerciseRunner from '../components/exercises/ExerciseRunner'
import CertificateTab from '../components/courses/CertificateTab'
import { getCourseAPI, getLessonsAPI, getMaterialsAPI, getMyGradesAPI, getMyEnrollmentsAPI } from '../api/courses'
import { getAnnouncementsAPI } from '../api/announcements'
import { getCourseFeedbacksAPI, createFeedbackAPI, deleteFeedbackAPI } from '../api/feedbacks'
import { formatDate, parseUTCDate } from '../utils/formatDate'
import { formatModality } from '../utils/formatModality'
import { generateCalendarDays } from '../utils/generateCalendarDays'
import { SITUATIONS, SITUATION_LABELS } from '../constants/enrollmentSitutation'
import { STATUS } from '../constants/enrollmentStatus'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { value: 'sobre', label: 'Sobre' },
  { value: 'cronograma', label: 'Cronograma' },
  { value: 'material', label: 'Material' },
  { value: 'avisos', label: 'Avisos' },
  { value: 'notas', label: 'Minhas notas' },
  { value: 'feedbacks', label: 'Feedbacks' }
]

// A aba "Certificado" só é exibida quando o curso está concluído (closed),
// mas é um destino válido de deep-link das notificações.
const CERTIFICATE_TAB = { value: 'certificado', label: 'Certificado' }
const VALID_TABS = [...tabs.map((t) => t.value), CERTIFICATE_TAB.value]

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
  const [myGrades, setMyGrades] = useState([])
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
  const [feedbacks, setFeedbacks] = useState([])
  const [starsFilter, setStarsFilter] = useState(null) // null = todas
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackStars, setFeedbackStars] = useState(0)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

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
        const [{ data: cData }, { data: lData }, { data: mData }, { data: gData }, { data: eData }, { data: aData }] = await Promise.all([
          getCourseAPI(courseId),
          getLessonsAPI(courseId),
          getMaterialsAPI(courseId),
          getMyGradesAPI(courseId),
          getMyEnrollmentsAPI(),
          getAnnouncementsAPI(courseId)
        ])
        if (controller.signal.aborted) return
        setCourse(cData.data)
        setLessons(lData.data)
        setMaterials(mData.data)
        setMyGrades(gData.data)
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

  useEffect(() => {
    const controller = new AbortController()
    const loadFeedbacks = async () => {
      try {
        const { data } = await getCourseFeedbacksAPI(courseId)
        if (controller.signal.aborted) return
        setFeedbacks(data.data)
      } catch (err) {
        // silencioso
      }
    }
    loadFeedbacks()
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
          const [{ data: cData }, { data: lData }, { data: mData }, { data: gData }, { data: aData }, { data: eData }] = await Promise.all([
            getCourseAPI(courseId),
            getLessonsAPI(courseId),
            getMaterialsAPI(courseId),
            getMyGradesAPI(courseId),
            getAnnouncementsAPI(courseId),
            getMyEnrollmentsAPI(),
          ])
          if (!active) return
          setCourse(cData.data)
          setLessons(lData.data)
          setMaterials(mData.data)
          setMyGrades(gData.data)
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

  const myFeedback = feedbacks.find(f => f.user?._id === user?._id)

  const othersFeedbacks = feedbacks
    .filter(f => f._id !== myFeedback?._id)
    .filter(f => starsFilter === null || f.stars === starsFilter)
    .sort((a, b) => b.stars - a.stars)

  const hasCompletedCourse =
    myEnrollment?.status === STATUS.COMPLETED &&
    myEnrollment?.situation !== SITUATIONS.DESISTENTE

  const handleCreateFeedback = async () => {
    if (!feedbackContent.trim() || feedbackStars === 0) {
      setToast({ show: true, message: 'Preencha o comentário e selecione uma nota.' })
      return
    }
    setSubmittingFeedback(true)
    try {
      const { data } = await createFeedbackAPI({
        course: courseId,
        content: feedbackContent.trim(),
        stars: feedbackStars
      })

      const novoFeedbackFormatado = {
        ...data.data,
        user: {
          _id: user?._id,
          name: user?.name,
          email: user?.email
        }
      }

      // Adiciona o feedback perfeitamente formatado no estado
      setFeedbacks(prev => [novoFeedbackFormatado, ...prev])

      setShowFeedbackForm(false)
      setFeedbackContent('')
      setFeedbackStars(0)
      setToast({ show: true, message: 'Feedback enviado com sucesso!' })
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || 'Erro ao enviar feedback.' })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const handleDeleteFeedback = async (id) => {
    try {
      await deleteFeedbackAPI(id)
      setFeedbacks(prev => prev.filter(f => f._id !== id))
      setToast({ show: true, message: 'Feedback excluído.' })
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || 'Erro ao excluir feedback.' })
    }
  }

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
              tabs={course?.status === 'closed' ? [...tabs, CERTIFICATE_TAB] : tabs}
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-4 bg-surface-blue rounded-card text-center">
                    <p className="text-xs text-text-muted mb-1">Média geral</p>
                    <p className="text-3xl font-bold text-primary">
                      {myEnrollment?.averageGrade != null ? myEnrollment.averageGrade.toFixed(1) : '—'}
                    </p>
                  </div>

                  <div className="p-4 bg-surface-blue rounded-card text-center flex flex-col items-center justify-center gap-1">
                    <p className="text-xs text-text-muted mb-1">Situação</p>
                    <Badge variant={
                      myEnrollment?.situation === SITUATIONS.APROVADO ? 'success' :
                        myEnrollment?.situation === SITUATIONS.REPROVADO ? 'error' :
                          myEnrollment?.situation === SITUATIONS.DESISTENTE ? 'warning' :
                            'gray'
                    } className="text-sm">
                      {SITUATION_LABELS[myEnrollment?.situation] || SITUATION_LABELS[SITUATIONS.PENDENTE]}
                    </Badge>
                  </div>
                </div>

                {myGrades.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-text-muted">Nenhuma nota lançada ainda.</p>
                  </div>
                ) : (
                  myGrades.map(g => (
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
                  ))
                )}
              </div>
            )}

            {activeTab === 'certificado' && course?.status === 'closed' && (
              <CertificateTab courseId={courseId} enrollment={myEnrollment} />
            )}

            {activeTab === 'feedbacks' && (
              <div className="space-y-5">

                {/* Botão / aviso de adicionar feedback */}
                <div className="card p-4">
                  {myFeedback ? (
                    <p className="text-sm text-text-muted text-center py-1">
                      Você já avaliou este curso. Máximo de feedbacks adicionados.
                    </p>
                  ) : !hasCompletedCourse ? (
                    <div className="text-center py-1">
                      <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
                        <Plus size={16} /> Adicionar feedback
                      </button>
                      <p className="text-xs text-text-muted mt-2">Conclua o curso para adicionar feedback.</p>
                    </div>
                  ) : !showFeedbackForm ? (
                    <button onClick={() => setShowFeedbackForm(true)} className="btn-primary w-full">
                      <Plus size={16} /> Adicionar feedback
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 justify-center">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" onClick={() => setFeedbackStars(n)}>
                            <Star
                              size={24}
                              className={n <= feedbackStars ? 'fill-warning text-warning' : 'text-border'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedbackContent}
                        onChange={(e) => setFeedbackContent(e.target.value)}
                        placeholder="Conte como foi sua experiência no curso..."
                        className="w-full p-3 border border-border rounded-card text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowFeedbackForm(false); setFeedbackContent(''); setFeedbackStars(0) }}
                          className="btn-secondary flex-1"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateFeedback}
                          disabled={submittingFeedback}
                          className="btn-primary flex-1"
                        >
                          {submittingFeedback ? 'Enviando...' : 'Enviar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback próprio em destaque */}
                {myFeedback && (
                  <div className="card p-4 ring-2 ring-primary bg-surface-blue">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={14} className={n <= myFeedback.stars ? 'fill-warning text-warning' : 'text-border'} />
                          ))}
                        </div>
                        <p className="text-xs font-semibold text-primary mt-1">Seu feedback</p>
                      </div>
                      <button onClick={() => handleDeleteFeedback(myFeedback._id)} className="text-text-muted hover:text-error transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-text-secondary mt-2 leading-relaxed">{myFeedback.content}</p>
                  </div>
                )}

                {/* Filtro por estrelas */}
                {feedbacks.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => setStarsFilter(null)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${starsFilter === null ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
                    >
                      Todas
                    </button>
                    {[5, 4, 3, 2, 1].map(n => (
                      <button
                        key={n}
                        onClick={() => setStarsFilter(n)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${starsFilter === n ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
                      >
                        {n} <Star size={11} className={starsFilter === n ? 'fill-white' : 'fill-warning text-warning'} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Lista dos demais feedbacks */}
                {othersFeedbacks.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-8">
                    {feedbacks.length === 0 ? 'Nenhum feedback ainda.' : 'Nenhum feedback com essa quantidade de estrelas.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {othersFeedbacks.map(f => (
                      <div key={f._id} className="card p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-text-primary">{f.user?.name || 'Aluno'}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} size={13} className={n <= f.stars ? 'fill-warning text-warning' : 'text-border'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{f.content}</p>
                      </div>
                    ))}
                  </div>
                )}
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