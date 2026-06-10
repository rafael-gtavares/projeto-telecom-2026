import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, GraduationCap, Users, BookOpen, BarChart2, Settings, Plus, ChevronLeft, ChevronRight, Video, FileText, FileQuestion, Link, File, Search, X, ChevronRight as ChevronRightIcon, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Tabs, Spinner, Badge, Avatar, ViewToggle } from '../components/ui/index'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import CourseModal from '../components/courses/CourseModal'
import Input from '../components/ui/Input'
import {
  getCourseAPI, updateCourseAPI, deleteCourseAPI,
  getLessonsAPI, createLessonAPI, updateLessonAPI, deleteLessonAPI,
  getMaterialsAPI, createMaterialAPI, updateMaterialAPI, deleteMaterialAPI,
  getCourseStudentsAPI,
  getCourseGradesAPI, createGradeAPI, updateGradeAPI, deleteGradeAPI,
  addAllowedProfessorAPI, removeAllowedProfessorAPI,
} from '../api/courses'
import { getUsersBaseAPI } from '../api/users'
import { formatDate, parseUTCDate } from '../utils/formatDate'
import { formatModality } from '../utils/formatModality'
import { generateCalendarDays } from '../utils/generateCalendarDays'

const MetricCard = ({ label, value, icon: Icon }) => (
  <div className="card p-4 flex flex-col justify-center">
    <div className="flex items-center gap-2 mb-2 text-text-muted">
      <Icon size={16} />
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-2xl font-bold text-primary">{value}</span>
  </div>
)

const AdminCourse = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user, role } = useAuth()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('aulas')

  // Modais de Curso
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Aulas
  const [lessons, setLessons] = useState([])
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null)
  const [lessonModal, setLessonModal] = useState({ open: false, lesson: null })
  const [lessonSaveLoading, setLessonSaveLoading] = useState(false)
  const [lessonForm, setLessonForm] = useState({ title: '', date: '', modality: 'presencial', startTime: '', endTime: '', location: '', meetingUrl: '', description: '' })
  const [lessonsView, setLessonsView] = useState(() => localStorage.getItem('adminCourseLessonsView') || 'list')

  const toggleLessonsView = (mode) => {
    setLessonsView(mode)
    localStorage.setItem('adminCourseLessonsView', mode)
  }

  // Alunos e Notas
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])
  const [studentModal, setStudentModal] = useState({ open: false, student: null })
  const [gradeModal, setGradeModal] = useState({ open: false, student: null })
  const [gradeSaveLoading, setGradeSaveLoading] = useState(false)
  const [gradeForm, setGradeForm] = useState({ title: '', type: 'prova', grade: '', feedback: '' })

  // Material
  const [materials, setMaterials] = useState([])
  const [materialModal, setMaterialModal] = useState({ open: false, material: null })
  const [materialSaveLoading, setMaterialSaveLoading] = useState(false)
  const [materialForm, setMaterialForm] = useState({ title: '', type: 'leitura', content: '', description: '' })

  // Config (Acesso ao curso + status)
  const [configUsers, setConfigUsers] = useState([])
  const [configUsersLoading, setConfigUsersLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState({ show: false, message: '' })
  const showToast = useCallback((message) => setToast({ show: true, message }), [])

  // Modal de confirmação genérico (substituindo window.confirm)
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null })

  const tabs = [
    { value: 'aulas', label: 'Aulas' },
    { value: 'alunos', label: 'Alunos' },
    { value: 'material', label: 'Material' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'config', label: 'Config.' },
  ]

  const loadData = async () => {
    setLoading(true)
    try {
      const [{ data: cData }, { data: lData }, { data: mData }, { data: sData }, { data: gData }] = await Promise.all([
        getCourseAPI(courseId),
        getLessonsAPI(courseId),
        getMaterialsAPI(courseId),
        getCourseStudentsAPI(courseId),
        getCourseGradesAPI(courseId)
      ])
      setCourse(cData.data)
      setLessons(lData.data)
      setMaterials(mData.data)
      setStudents(sData.data)
      setGrades(gData.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [courseId])

  // --- Handlers do Curso ---
  const handleSaveCourse = async (payload) => {
    setSaveLoading(true)
    try {
      const { data } = await updateCourseAPI(course._id, payload)
      setCourse(data.data)
      setEditModal(false)
    } catch (err) { showToast('Erro ao salvar curso') }
    finally { setSaveLoading(false) }
  }

  const handleDeleteCourse = async () => {
    setDeleteLoading(true)
    try {
      await deleteCourseAPI(course._id)
      navigate('/admin/cursos')
    } catch (err) { showToast('Erro ao deletar curso') }
    finally { setDeleteLoading(false) }
  }

  // --- Handlers de Aulas ---
  useEffect(() => {
    if (lessonModal.open && lessonModal.lesson) {
      setLessonForm({
        title: lessonModal.lesson.title || '',
        date: lessonModal.lesson.date ? parseUTCDate(lessonModal.lesson.date).toISOString().slice(0, 10) : '',
        modality: lessonModal.lesson.modality || 'presencial',
        startTime: lessonModal.lesson.startTime || '',
        endTime: lessonModal.lesson.endTime || '',
        location: lessonModal.lesson.location || '',
        meetingUrl: lessonModal.lesson.meetingUrl || '',
        description: lessonModal.lesson.description || ''
      })
    } else {
      setLessonForm({ title: '', date: '', modality: 'presencial', startTime: '', endTime: '', location: '', meetingUrl: '', description: '' })
    }
  }, [lessonModal.open])

  const handleSaveLesson = async () => {
    if (!lessonForm.title || !lessonForm.date || !lessonForm.startTime || !lessonForm.endTime) return
    setLessonSaveLoading(true)
    try {
      if (lessonModal.lesson) {
        const { data } = await updateLessonAPI(courseId, lessonModal.lesson._id, lessonForm)
        setLessons(prev => prev.map(l => l._id === data.data._id ? data.data : l))
      } else {
        const { data } = await createLessonAPI(courseId, lessonForm)
        setLessons(prev => [...prev, data.data].sort((a, b) => new Date(a.date) - new Date(b.date)))
      }
      setLessonModal({ open: false, lesson: null })
    } catch (err) { showToast('Erro ao salvar aula') }
    finally { setLessonSaveLoading(false) }
  }

  const handleDeleteLesson = (id) => {
    setConfirmModal({
      open: true,
      message: 'Deseja excluir esta aula?',
      onConfirm: async () => {
        try {
          await deleteLessonAPI(courseId, id)
          setLessons(prev => prev.filter(l => l._id !== id))
        } catch { showToast('Erro ao excluir aula') }
      },
    })
  }

  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))

  // --- Handlers de Material ---
  useEffect(() => {
    if (materialModal.open && materialModal.material) {
      setMaterialForm({
        title: materialModal.material.title || '',
        type: materialModal.material.type || 'leitura',
        content: materialModal.material.content || '',
        description: materialModal.material.description || ''
      })
    } else {
      setMaterialForm({ title: '', type: 'leitura', content: '', description: '' })
    }
  }, [materialModal.open])

  const handleSaveMaterial = async () => {
    if (!materialForm.title) return
    setMaterialSaveLoading(true)
    try {
      if (materialModal.material) {
        const { data } = await updateMaterialAPI(courseId, materialModal.material._id, materialForm)
        setMaterials(prev => prev.map(m => m._id === data.data._id ? data.data : m))
      } else {
        const { data } = await createMaterialAPI(courseId, materialForm)
        setMaterials(prev => [...prev, data.data])
      }
      setMaterialModal({ open: false, material: null })
    } catch (err) { showToast('Erro ao salvar material') }
    finally { setMaterialSaveLoading(false) }
  }

  const handleDeleteMaterial = (id) => {
    setConfirmModal({
      open: true,
      message: 'Deseja excluir este material?',
      onConfirm: async () => {
        try {
          await deleteMaterialAPI(courseId, id)
          setMaterials(prev => prev.filter(m => m._id !== id))
        } catch { showToast('Erro ao excluir material') }
      },
    })
  }

  // --- Handlers de Notas ---
  useEffect(() => {
    if (!gradeModal.open) {
      setGradeForm({ title: '', type: 'prova', grade: '', feedback: '' })
    }
  }, [gradeModal.open])

  const handleSaveGrade = async () => {
    if (!gradeForm.title || !gradeForm.grade) return
    setGradeSaveLoading(true)
    try {
      const payload = { ...gradeForm, studentId: gradeModal.student._id }
      const { data } = await createGradeAPI(courseId, payload)
      setGrades(prev => [data.data, ...prev])
      setGradeModal({ open: false, student: null })
    } catch (err) { showToast('Erro ao lançar nota') }
    finally { setGradeSaveLoading(false) }
  }

  const handleDeleteGrade = (id) => {
    setConfirmModal({
      open: true,
      message: 'Deseja excluir esta nota?',
      onConfirm: async () => {
        try {
          await deleteGradeAPI(courseId, id)
          setGrades(prev => prev.filter(g => g._id !== id))
        } catch { showToast('Erro ao excluir nota') }
      },
    })
  }

  // --- Handlers Config ---
  useEffect(() => {
    if (activeTab !== 'config') return

    setConfigUsersLoading(true)

    getUsersBaseAPI()
      .then(({ data }) => {
        const users = [...data.data.users]

        users.sort((a, b) => {
          const aIsCreator = course.professor?._id === a._id || course.professor === a._id
          const bIsCreator = course.professor?._id === b._id || course.professor === b._id
          if (aIsCreator) return -1
          if (bIsCreator) return 1
          return 0
        })

        setConfigUsers(users)
      })
      .catch((err) => {
        console.error('ERRO CONFIG USERS:', err)
        showToast('Erro ao carregar usuários')
      })
      .finally(() => setConfigUsersLoading(false))
  }, [activeTab, course?.professor])

  const STATUS_LABELS = {
    draft: 'Rascunho',
    published: 'Publicado',
    em_andamento: 'Em Andamento',
    closed: 'Encerrado',
  }

  const handleChangeStatus = (newStatus) => {
    if (newStatus === course.status) return

    const label = STATUS_LABELS[newStatus] || newStatus
    const current = STATUS_LABELS[course.status] || course.status

    setConfirmModal({
      open: true,
      message: `Deseja alterar o status do curso de "${current}" para "${label}"? Isso pode afetar as inscrições dos alunos.`,
      onConfirm: async () => {
        setStatusLoading(true)
        try {
          const { data } = await updateCourseAPI(courseId, { status: newStatus })
          setCourse(data.data)
          showToast('Status atualizado com sucesso')
        } catch (err) { showToast(err.response?.data?.message || 'Erro ao alterar status do curso') }
        finally { setStatusLoading(false) }
      },
    })
  }

  const handleGrantAccess = async (userId) => {
    try {
      const { data } = await addAllowedProfessorAPI(courseId, userId)
      setCourse(prev => ({ ...prev, allowedProfessors: data.data }))
    } catch (err) { showToast(err.response?.data?.message || 'Erro ao conceder acesso') }
  }

  const handleRevokeAccess = (profId) => {
    setConfirmModal({
      open: true,
      message: 'Remover acesso deste professor?',
      onConfirm: async () => {
        try {
          await removeAllowedProfessorAPI(courseId, profId)
          setCourse(prev => ({ ...prev, allowedProfessors: prev.allowedProfessors.filter(p => p._id !== profId) }))
        } catch { showToast('Erro ao remover acesso') }
      },
    })
  }

  if (loading || !course) return <div className="flex justify-center p-12"><Spinner /></div>

  return (
    <div className="min-h-screen bg-surface-page pb-16">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Header da página */}
        <button onClick={() => navigate('/admin/cursos')}
          className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4 text-sm font-medium">
          <ArrowLeft size={16} /> Voltar para cursos
        </button>

        <div className="relative w-full h-48 md:h-56 rounded-card overflow-hidden mb-0">
          {course.imageUrl
            ? <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light" />
          }
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <h1 className="text-white font-bold text-xl md:text-2xl text-center leading-tight">{course.title}</h1>
            <Badge className="mt-2">{formatModality(course.modality)}</Badge>
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={() => setEditModal(true)}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
              <Edit2 size={16} />
            </button>
            <button onClick={() => setDeleteModal(true)}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-red-500/80 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Abas + conteúdo */}
        <div>
          <div className="border-b border-border bg-white px-4 sticky top-0 z-10 rounded-t-card">
            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="bg-white rounded-b-card border border-border border-t-0">

            {/* ABA AULAS */}
            {activeTab === 'aulas' && (
              <div className="p-4 md:p-6 space-y-6">

                <div className="flex justify-end">
                  <Button variant="primary" className="gap-2 text-sm" onClick={() => setLessonModal({ open: true, lesson: null })}>
                    <Plus size={15} /> Nova aula
                  </Button>
                </div>

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

                  {/* Grid */}
                  <div className="p-3">
                    <div className="grid grid-cols-7 text-center mb-1">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="text-[10px] font-bold text-text-muted uppercase py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1">
                      {generateCalendarDays(calendarDate, lessons).map(({ day, date, lessonCount }, idx) => {
                        const today       = day && date?.toDateString() === new Date().toDateString()
                        const isSelected  = day && selectedCalendarDay?.toDateString() === date?.toDateString()
                        const hasLessons  = lessonCount > 0
                        // Comparação UTC-safe: parseUTCDate garante que course.startDate/endDate
                        // sejam interpretadas como datas locais, igual ao que já é feito nas listas.
                        const isStart     = day && course.startDate && date?.toDateString() === parseUTCDate(course.startDate).toDateString()
                        const isEnd       = day && course.endDate   && date?.toDateString() === parseUTCDate(course.endDate).toDateString()
                        const isMilestone = isStart || isEnd

                        return (
                          <div key={idx}
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
                            <span className={`font-semibold leading-none text-sm ${
                              isSelected        ? 'text-white'
                              : isStart && isEnd ? 'text-success'
                              : isStart          ? 'text-success'
                              : isEnd            ? 'text-warning'
                              : today            ? 'text-primary'
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
                    const dayIsEnd   = course.endDate   && selectedCalendarDay.toDateString() === parseUTCDate(course.endDate).toDateString()
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
                            <button onClick={() => setLessonModal({ open: true, lesson })}
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
                    {lessons.length > 0 && <ViewToggle value={lessonsView} onChange={toggleLessonsView} />}
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
                          <button onClick={() => setLessonModal({ open: true, lesson })}
                            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteLesson(lesson._id)}
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
                              <button onClick={() => setLessonModal({ open: true, lesson })}
                                className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteLesson(lesson._id)}
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
            )}

            {/* ABA ALUNOS */}
            {activeTab === 'alunos' && (
              <div className="p-4 md:p-6 space-y-4">
                <h3 className="font-semibold text-text-primary">
                  Alunos inscritos — {students.length} aluno{students.length !== 1 ? 's' : ''}
                </h3>

                {students.length === 0 ? (
                  <div className="text-center py-12 text-text-muted text-sm">Nenhum aluno inscrito ainda.</div>
                ) : (
                  <div className="space-y-2">
                    {students.map(({ _id, user: student, status }) => (
                      <button
                        key={_id}
                        onClick={() => setStudentModal({ open: true, student })}
                        className="w-full flex items-center gap-3 p-3 card hover:shadow-hover hover:border-primary transition-all text-left"
                      >
                        <Avatar name={student.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-primary text-sm truncate">{student.name}</p>
                          <p className="text-xs text-text-muted truncate">{student.email}</p>
                        </div>
                        <Badge variant={status === 'ativo' ? 'success' : 'blue'}>
                          {status === 'ativo' ? 'Ativo' : 'Inscrito'}
                        </Badge>
                        <ChevronRightIcon size={16} className="text-text-muted flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA MATERIAL */}
            {activeTab === 'material' && (
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex justify-end">
                  <Button variant="primary" className="gap-2 text-sm" onClick={() => setMaterialModal({ open: true, material: null })}>
                    <Plus size={15} /> Novo material
                  </Button>
                </div>

                {materials.length === 0 ? (
                  <div className="text-center py-12 text-text-muted text-sm">Nenhum material cadastrado.</div>
                ) : (
                  <div className="space-y-3">
                    {materials.map(mat => {
                      const typeIcon = {
                        leitura: <BookOpen size={16} />,
                        video: <Video size={16} />,
                        exercicio: <FileText size={16} />,
                        prova: <FileQuestion size={16} />,
                        link: <Link size={16} />,
                        outro: <File size={16} />,
                      }[mat.type] || <File size={16} />

                      return (
                        <div key={mat._id} className="card p-4 flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-card bg-surface-hover flex items-center justify-center flex-shrink-0 text-primary">
                            {typeIcon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-text-primary text-sm">{mat.title}</h4>
                            <Badge variant="gray" className="text-xs mt-1">{mat.type}</Badge>
                            {mat.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{mat.description}</p>}
                            {mat.content && (
                              <a href={mat.content} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 block truncate">
                                {mat.content}
                              </a>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => setMaterialModal({ open: true, material: mat })}
                              className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteMaterial(mat._id)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ABA DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard label="Alunos inscritos" value={students.length} icon={Users} />
                  <MetricCard label="Aulas cadastradas" value={lessons.length} icon={BookOpen} />
                  <MetricCard label="Materiais" value={materials.length} icon={FileText} />
                  <MetricCard label="Ocupação" value={`${course.maxSlots > 0 ? Math.round((course.enrolledCount / course.maxSlots) * 100) : 0}%`} icon={BarChart2} />
                </div>
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-3 text-sm">Informações do curso</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-text-muted text-xs">Início</p><p className="font-medium">{formatDate(course.startDate)}</p></div>
                    <div><p className="text-text-muted text-xs">Término</p><p className="font-medium">{formatDate(course.endDate)}</p></div>
                    <div><p className="text-text-muted text-xs">Modalidade</p><p className="font-medium">{formatModality(course.modality)}</p></div>
                    <div><p className="text-text-muted text-xs">Local</p><p className="font-medium">{course.location || '—'}</p></div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA CONFIG */}
            {activeTab === 'config' && (
              <div className="p-4 md:p-6 space-y-6">

                {/* Status do Curso */}
                <div className="pb-6 border-b border-border">
                  <h3 className="font-semibold text-text-primary mb-1">Status do curso</h3>
                  <p className="text-xs text-text-muted mb-4">
                    Controla a visibilidade e o acesso dos alunos. Você pode alterar em qualquer direção.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'draft', label: 'Rascunho', desc: 'Oculto para alunos', dot: 'bg-text-muted' },
                      { key: 'published', label: 'Publicado', desc: 'Visível, inscrições abertas', dot: 'bg-success' },
                      { key: 'em_andamento', label: 'Em Andamento', desc: 'Curso em execução', dot: 'bg-blue-500' },
                      { key: 'closed', label: 'Encerrado', desc: 'Curso finalizado', dot: 'bg-warning' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => handleChangeStatus(opt.key)}
                        disabled={statusLoading || course.status === opt.key}
                        className={`p-3 rounded-xl border text-left transition-all disabled:opacity-60 ${course.status === opt.key
                          ? 'border-primary bg-primary/5 cursor-default'
                          : 'border-border hover:border-primary/50 bg-white cursor-pointer'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                          <span className={`text-sm font-semibold ${course.status === opt.key ? 'text-primary' : 'text-text-primary'}`}>
                            {opt.label}
                          </span>
                          {course.status === opt.key && <CheckCircle size={13} className="text-primary ml-auto" />}
                        </div>
                        <p className="text-xs text-text-muted pl-4">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  {statusLoading && (
                    <div className="flex justify-center mt-4"><Spinner /></div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Acesso ao curso</h3>
                  <p className="text-xs text-text-muted mb-4">
                    Professores com acesso podem gerenciar aulas, materiais e notas. Admins sempre têm acesso total.
                  </p>

                  {configUsersLoading ? (
                    <div className="flex justify-center py-8"><Spinner /></div>
                  ) : (
                    <div className="space-y-2">
                      {configUsers.map(u => {
                        const isCreator = course.professor?._id === u._id || course.professor === u._id
                        const isAdmin = u.role === 'admin'
                        const hasAccess = isCreator || isAdmin || (course.allowedProfessors || []).some(p => p._id === u._id)

                        return (
                          <div key={u._id} className="flex items-center gap-3 p-3 card">
                            <Avatar name={u.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                              <p className="text-xs text-text-muted">{u.email}</p>
                            </div>

                            {isCreator ? (
                              <Badge variant="blue">Criador</Badge>
                            ) : isAdmin ? (
                              <Badge variant="success">Admin</Badge>
                            ) : hasAccess ? (
                              <button
                                onClick={() => handleRevokeAccess(u._id)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-success border border-success/30 bg-success/5 hover:bg-error/10 hover:text-error hover:border-error/30 px-3 py-1.5 rounded-full transition-all"
                              >
                                <CheckCircle size={13} /> Com acesso
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGrantAccess(u._id)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-text-muted border border-border hover:bg-primary/5 hover:text-primary hover:border-primary/30 px-3 py-1.5 rounded-full transition-all"
                              >
                                <Plus size={13} /> Sem acesso
                              </button>
                            )}
                          </div>
                        )
                      })}
                      {configUsers.length === 0 && (
                        <p className="text-sm text-text-muted text-center py-6">Nenhum professor ou admin encontrado.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* --- Modais do Curso --- */}
      <CourseModal
        open={editModal}
        onClose={() => setEditModal(false)}
        course={course}
        onSave={handleSaveCourse}
        loading={saveLoading}
      />

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir curso" size="sm">
        <p className="text-text-secondary text-sm mb-5">
          Tem certeza que deseja excluir <strong>"{course.title}"</strong>?
        </p>
        <div className="flex gap-3">
          <button onClick={handleDeleteCourse} disabled={deleteLoading} className="flex-1 btn-primary bg-error hover:bg-error-text justify-center">
            {deleteLoading ? 'Excluindo...' : 'Excluir'}
          </button>
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>Cancelar</Button>
        </div>
      </Modal>

      {/* --- Modais de Aulas --- */}
      <Modal open={lessonModal.open} onClose={() => setLessonModal({ open: false, lesson: null })} title={lessonModal.lesson ? 'Editar aula' : 'Nova aula'} size="md">
        <div className="space-y-4">
          <Input label="Título da aula *" value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data *" type="date" value={lessonForm.date} onChange={e => setLessonForm(f => ({ ...f, date: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Modalidade</label>
              <select value={lessonForm.modality} onChange={e => setLessonForm(f => ({ ...f, modality: e.target.value }))} className="input-field w-full">
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Início *" type="time" value={lessonForm.startTime} onChange={e => setLessonForm(f => ({ ...f, startTime: e.target.value }))} />
            <Input label="Fim *" type="time" value={lessonForm.endTime} onChange={e => setLessonForm(f => ({ ...f, endTime: e.target.value }))} />
          </div>
          <Input label="Local / Sala" value={lessonForm.location} onChange={e => setLessonForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Lab 2" />
          <Input label="Link da aula (online)" type="url" value={lessonForm.meetingUrl} onChange={e => setLessonForm(f => ({ ...f, meetingUrl: e.target.value }))} placeholder="https://meet.google.com/..." />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição</label>
            <textarea value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input-field w-full resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="primary" className="flex-1" onClick={handleSaveLesson} loading={lessonSaveLoading}>
              {lessonModal.lesson ? 'Salvar' : 'Criar aula'}
            </Button>
            <Button variant="secondary" onClick={() => setLessonModal({ open: false, lesson: null })}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* --- Modais de Alunos e Notas --- */}
      <Modal open={studentModal.open} onClose={() => setStudentModal({ open: false, student: null })} title={studentModal.student?.name || 'Aluno'} size="md">
        {studentModal.student && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={studentModal.student.name} size="lg" />
              <div>
                <p className="font-semibold text-text-primary">{studentModal.student.name}</p>
                <p className="text-sm text-text-muted">{studentModal.student.email}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-text-primary text-sm">Notas</h4>
                <Button variant="secondary" className="text-xs py-1.5 px-3 gap-1" onClick={() => setGradeModal({ open: true, student: studentModal.student })}>
                  <Plus size={13} /> Lançar nota
                </Button>
              </div>
              {grades.filter(g => g.student._id === studentModal.student._id).length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Nenhuma nota lançada ainda.</p>
              ) : (
                grades.filter(g => g.student._id === studentModal.student._id).map(g => (
                  <div key={g._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{g.title}</p>
                      <p className="text-xs text-text-muted">{g.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{g.grade}</span>
                      <span className="text-text-muted text-xs">/{g.maxGrade}</span>
                      <button onClick={() => handleDeleteGrade(g._id)} className="p-1 text-text-muted hover:text-error transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={gradeModal.open} onClose={() => setGradeModal({ open: false, student: null })} title="Lançar nota" size="sm">
        <div className="space-y-4">
          <Input label="Título da avaliação *" value={gradeForm.title} onChange={e => setGradeForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Prova 1" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Tipo</label>
              <select value={gradeForm.type} onChange={e => setGradeForm(f => ({ ...f, type: e.target.value }))} className="input-field w-full">
                <option value="prova">Prova</option>
                <option value="trabalho">Trabalho</option>
                <option value="exercicio">Exercício</option>
                <option value="participacao">Participação</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <Input label="Nota (0-10)" type="number" min="0" max="10" step="0.1" value={gradeForm.grade} onChange={e => setGradeForm(f => ({ ...f, grade: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Feedback (opcional)</label>
            <textarea value={gradeForm.feedback} onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))} rows={2} className="input-field w-full resize-none" />
          </div>
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={handleSaveGrade} loading={gradeSaveLoading}>Lançar nota</Button>
            <Button variant="secondary" onClick={() => setGradeModal({ open: false, student: null })}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* --- Modal de confirmação genérico --- */}
      <Modal open={confirmModal.open} onClose={() => setConfirmModal({ open: false, message: '', onConfirm: null })} title="Confirmar" size="sm">
        <p className="text-text-secondary text-sm mb-5">{confirmModal.message}</p>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              setConfirmModal({ open: false, message: '', onConfirm: null })
              if (confirmModal.onConfirm) await confirmModal.onConfirm()
            }}
            className="flex-1 btn-primary justify-center"
          >
            Confirmar
          </button>
          <Button variant="secondary" onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })}>
            Cancelar
          </Button>
        </div>
      </Modal>

      {/* --- Toast --- */}
      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ show: false, message: '' })} />

      {/* --- Modais de Material --- */}
      <Modal open={materialModal.open} onClose={() => setMaterialModal({ open: false, material: null })} title={materialModal.material ? 'Editar material' : 'Novo material'} size="md">
        <div className="space-y-4">
          <Input label="Título *" value={materialForm.title} onChange={e => setMaterialForm(f => ({ ...f, title: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Tipo *</label>
            <select value={materialForm.type} onChange={e => setMaterialForm(f => ({ ...f, type: e.target.value }))} className="input-field w-full">
              <option value="leitura">Leitura</option>
              <option value="video">Vídeo</option>
              <option value="exercicio">Exercício</option>
              <option value="prova">Prova</option>
              <option value="link">Link externo</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {materialForm.type === 'leitura' ? 'Conteúdo (texto)' :
                materialForm.type === 'video' ? 'URL do vídeo' :
                  materialForm.type === 'link' ? 'URL do link' : 'Conteúdo / URL'}
            </label>
            {materialForm.type === 'leitura' ? (
              <textarea value={materialForm.content} onChange={e => setMaterialForm(f => ({ ...f, content: e.target.value }))} rows={5} className="input-field w-full resize-none" placeholder="Digite o conteúdo de leitura..." />
            ) : (
              <input type="url" value={materialForm.content} onChange={e => setMaterialForm(f => ({ ...f, content: e.target.value }))} className="input-field w-full" placeholder="https://..." />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição</label>
            <textarea value={materialForm.description} onChange={e => setMaterialForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input-field w-full resize-none" />
          </div>
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={handleSaveMaterial} loading={materialSaveLoading}>
              {materialModal.material ? 'Salvar' : 'Criar material'}
            </Button>
            <Button variant="secondary" onClick={() => setMaterialModal({ open: false, material: null })}>Cancelar</Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}

export default AdminCourse