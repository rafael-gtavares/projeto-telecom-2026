import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Download, ExternalLink } from 'lucide-react'
import { Tabs, Spinner, Badge } from '../components/ui/index'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import ConfirmModal from '../components/ui/ConfirmModal'
import CourseModal from '../components/courses/CourseModal'

import LessonsTab from '../components/courses/admin/LessonsTab'
import LessonModal from '../components/courses/admin/LessonModal'
import LessonContentModal from '../components/courses/admin/LessonContentModal'
import LessonExerciseModal from '../components/courses/admin/LessonExerciseModal'

import StudentsTab from '../components/courses/admin/StudentsTab'
import StudentDetailModal from '../components/courses/admin/StudentDetailModal'
import AssessmentsTab from '../components/courses/admin/assessments/AssessmentsTab'

import MaterialsTab from '../components/courses/admin/MaterialsTab'
import MaterialModal from '../components/courses/admin/MaterialModal'

import DashboardTab from '../components/courses/admin/DashboardTab'
import ConfigTab from '../components/courses/admin/ConfigTab'

import AnnouncementsTab from '../components/courses/admin/AnnouncementsTab'
import AnnouncementModal from '../components/courses/admin/AnnouncementModal'
import CertificateCard from '../components/courses/CertificateCard'
import FeedbackTab from '../components/courses/admin/feedback/FeedbackTab'
import FeedbacksTab from '../components/courses/admin/FeedbacksTab'

import { useConfirmModal } from '../hooks/useConfirmModal'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../context/AuthContext'

import { isAdmin as isAdminRole } from '../utils/permissions'
import {
  getCourseAPI, updateCourseAPI, deleteCourseAPI,
  getLessonsAPI, updateLessonAPI, deleteLessonAPI,
  getMaterialsAPI, createMaterialAPI, updateMaterialAPI, deleteMaterialAPI,
  getCourseStudentsAPI,
  addAllowedProfessorAPI, removeAllowedProfessorAPI, updateSituationAPI,
  releaseCertificateAPI, getCertificatePdfAPI,
} from '../api/courses'
import {
  getAssessmentsAPI, updateGradingConfigAPI,
  createAssessmentAPI, updateAssessmentAPI, deleteAssessmentAPI, saveScoresAPI,
} from '../api/assessments'
import { getAnnouncementsAPI, createAnnouncementAPI, deleteAnnouncementAPI } from '../api/announcements'
import { getCourseFeedbacksAPI } from '../api/feedbacks'
import { readBlobError } from '../utils/blobError'
import { getUsersBaseAPI } from '../api/users'
import { uploadFileAPI } from '../api/upload'
import { formatModality } from '../utils/formatModality'

const TABS = [
  { value: 'aulas', label: 'Aulas' },
  { value: 'alunos', label: 'Alunos' },
  { value: 'avaliacoes', label: 'Avaliações' },
  { value: 'material', label: 'Material' },
  { value: 'avisos', label: 'Avisos' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'feedbacks', label: 'Feedbacks' },
  { value: 'config', label: 'Config.' },
]

const AdminCourse = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
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
  const [lessonsView, setLessonsView] = useState(() => localStorage.getItem('adminCourseLessonsView') || 'list')

  const [contentModal, setContentModal] = useState({ open: false, lesson: null })
  const [contentSaving, setContentSaving] = useState(false)

  const [exerciseModal, setExerciseModal] = useState({ open: false, lesson: null })
  const [exerciseSaving, setExerciseSaving] = useState(false)

  // Alunos e Avaliações
  const [students, setStudents] = useState([])
  const [studentsView, setStudentsView] = useState(() => localStorage.getItem('adminCourseStudentsView') || 'list')
  const [assessments, setAssessments] = useState([])
  const [assessmentScores, setAssessmentScores] = useState([])
  const [gradingConfig, setGradingConfig] = useState({ method: 'media_ponderada', passingGrade: 6 })
  const [studentModal, setStudentModal] = useState({ open: false, enrollment: null })
  const [certificateSavingId, setCertificateSavingId] = useState(null) // _id do enrollment liberando certificado
  const [certPreview, setCertPreview] = useState({ open: false, url: null, name: '', enrollment: null })

  // Material
  const [materials, setMaterials] = useState([])
  const [materialModal, setMaterialModal] = useState({ open: false, material: null })
  const [materialSaveLoading, setMaterialSaveLoading] = useState(false)

  // Avisos
  const [announcements, setAnnouncements] = useState([])
  const [announcementModal, setAnnouncementModal] = useState(false)
  const [announcementSaveLoading, setAnnouncementSaveLoading] = useState(false)

  // Config
  const [configUsers, setConfigUsers] = useState([])
  const [configUsersLoading, setConfigUsersLoading] = useState(false)

  // Depoimentos (feedback antigo) do curso — carregados ao abrir a aba
  const [courseFeedbacks, setCourseFeedbacks] = useState([])
  const [courseFeedbacksLoading, setCourseFeedbacksLoading] = useState(true)


  const { toast, showToast, closeToast } = useToast()
  const { confirmModal, confirm, close: closeConfirm, handleConfirm } = useConfirmModal()
  const { user } = useAuth()

  // Aviso exibido quando o gestor tenta emitir sem ter uma assinatura configurada
  const [signatureWarnOpen, setSignatureWarnOpen] = useState(false)
  const hasSignature = !!user?.signature?.text

  const loadData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [{ data: cData }, { data: lData }, { data: mData }, { data: sData }, { data: asmtData }, { data: aData }] = await Promise.all([
        getCourseAPI(courseId),
        getLessonsAPI(courseId),
        getMaterialsAPI(courseId),
        getCourseStudentsAPI(courseId),
        getAssessmentsAPI(courseId),
        getAnnouncementsAPI(courseId),
      ])
      setCourse(cData.data)
      setLessons(lData.data)
      setMaterials(mData.data)
      setStudents(sData.data)
      setGradingConfig(asmtData.data.config)
      setAssessments(asmtData.data.assessments)
      setAssessmentScores(asmtData.data.scores)
      setAnnouncements(aData.data)
    } catch (err) {
      if (err.response?.status === 403) {
        setLoadError('Você não tem acesso a este curso.')
      } else {
        setLoadError('Erro ao carregar os dados do curso.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  // Carrega os depoimentos (feedback antigo) do curso ao abrir a aba de feedback
  useEffect(() => {
    if (activeTab !== 'feedbacks') return
    setCourseFeedbacksLoading(true)
    getCourseFeedbacksAPI(courseId)
      .then(({ data }) => setCourseFeedbacks(data.data))
      .catch(() => setCourseFeedbacks([]))
      .finally(() => setCourseFeedbacksLoading(false))
  }, [activeTab, courseId])


  // --- Handlers do Curso ---
  const handleSaveCourse = async (payload) => {
    setSaveLoading(true)
    try {
      const { data } = await updateCourseAPI(course._id, payload)
      setCourse(data.data)
      // Editar o cronograma reconcilia as aulas no backend (cria/remove).
      // Recarrega a lista para refletir na hora, sem precisar de F5.
      const { data: lData } = await getLessonsAPI(courseId)
      setLessons(lData.data)
      setSelectedCalendarDay(null)
      setEditModal(false)
      showToast('Curso atualizado com sucesso.')
    } catch {
      showToast('Erro ao salvar curso')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDeleteCourse = async () => {
    setDeleteLoading(true)
    try {
      await deleteCourseAPI(course._id)
      showToast('Curso excluído com sucesso.')
      navigate('/admin/cursos')
    } catch {
      showToast('Erro ao deletar curso')
    } finally {
      setDeleteLoading(false)
    }
  }

  // --- Handlers de Aulas ---
  const handleSaveLesson = async (form) => {
    if (form.startTime >= form.endTime) {
      showToast('O horário de início deve ser anterior ao de término')
      return
    }
    setLessonSaveLoading(true)
    try {
      const { data } = await updateLessonAPI(courseId, lessonModal.lesson._id, form)
      setLessons(prev => prev.map(l => l._id === data.data._id ? data.data : l))
      setLessonModal({ open: false, lesson: null })
      showToast('Aula atualizada com sucesso.')
    } catch {
      showToast('Erro ao salvar aula')
    } finally {
      setLessonSaveLoading(false)
    }
  }

  const handleDeleteLesson = (id) => {
    confirm('Deseja excluir esta aula?', async () => {
      try {
        await deleteLessonAPI(courseId, id)
        setLessons(prev => prev.filter(l => l._id !== id))
        showToast('Aula excluída com sucesso.')
      } catch {
        showToast('Erro ao excluir aula')
      }
    })
  }

  const handleSaveContent = async (content) => {
    setContentSaving(true)
    try {
      const { data } = await updateLessonAPI(courseId, contentModal.lesson._id, { content })
      setLessons(prev => prev.map(l => l._id === data.data._id ? data.data : l))
      setContentModal({ open: false, lesson: null })
      showToast('Conteúdo salvo com sucesso.')
    } catch {
      showToast('Erro ao salvar conteúdo')
    } finally {
      setContentSaving(false)
    }
  }

  const handleSaveExercises = async (draft) => {
    for (const q of draft) {
      if (!q.question.trim()) { showToast('Toda questão precisa de um enunciado'); return }
      if (q.options.length < 2) { showToast('Cada questão precisa de ao menos 2 alternativas'); return }
      if (q.options.some(o => !o.trim())) { showToast('Preencha todas as alternativas'); return }
    }
    const exercises = draft.map(q => ({
      question: q.question.trim(),
      options: q.options.map(o => o.trim()),
      correctIndex: q.correctIndex,
    }))
    setExerciseSaving(true)
    try {
      const { data } = await updateLessonAPI(courseId, exerciseModal.lesson._id, { exercises })
      setLessons(prev => prev.map(l => l._id === data.data._id ? data.data : l))
      setExerciseModal({ open: false, lesson: null })
      showToast('Exercícios salvos com sucesso')
    } catch {
      showToast('Erro ao salvar exercícios')
    } finally {
      setExerciseSaving(false)
    }
  }

  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))

  const toggleLessonsView = (mode) => {
    setLessonsView(mode)
    localStorage.setItem('adminCourseLessonsView', mode)
  }

  // --- Handlers de Material ---
  const handleSaveMaterial = async (form) => {
    setMaterialSaveLoading(true)
    try {
      let payload = { ...form }

      if (form.type === 'file' && form.file) {
        const formData = new FormData()
        formData.append('file', form.file)
        const { data } = await uploadFileAPI(formData)
        payload.content = data.url
      }

      if (materialModal.material) {
        const { data } = await updateMaterialAPI(courseId, materialModal.material._id, payload)
        setMaterials(prev => prev.map(m => m._id === data.data._id ? data.data : m))
      } else {
        delete payload.file
        const { data } = await createMaterialAPI(courseId, payload)
        setMaterials(prev => [...prev, data.data])
      }

      setMaterialModal({ open: false, material: null })
      showToast('Material salvo com sucesso.')
    } catch (err) {
      showToast('Erro ao salvar material')
      console.error(JSON.stringify(err.response?.data, null, 2))
    } finally {
      setMaterialSaveLoading(false)
    }
  }

  const handleDeleteMaterial = (id) => {
    confirm('Deseja excluir este material?', async () => {
      try {
        await deleteMaterialAPI(courseId, id)
        setMaterials(prev => prev.filter(m => m._id !== id))
        showToast('Material excluído com sucesso.')
      } catch {
        showToast('Erro ao excluir material')
      }
    })
  }

  // --- Handlers de Avisos ---
  const handleCreateAnnouncement = async (form) => {
    setAnnouncementSaveLoading(true)
    try {
      const { data } = await createAnnouncementAPI(courseId, form)
      setAnnouncements(prev => [data.data, ...prev])
      setAnnouncementModal(false)
      showToast('Aviso enviado com sucesso')
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao enviar aviso')
    } finally {
      setAnnouncementSaveLoading(false)
    }
  }

  const handleDeleteAnnouncement = (id) => {
    confirm('Deseja excluir este aviso?', async () => {
      try {
        await deleteAnnouncementAPI(courseId, id)
        setAnnouncements(prev => prev.filter(a => a._id !== id))
        showToast('Aviso excluído com sucesso.')
      } catch {
        showToast('Erro ao excluir aviso')
      }
    })
  }

  const toggleStudentsView = (mode) => {
    setStudentsView(mode)
    localStorage.setItem('adminCourseStudentsView', mode)
  }

  // --- Handlers de Avaliações ---
  // Recarrega a lista de alunos (nota final/situação mudam no backend após
  // lançar notas, editar avaliação ou alterar a configuração).
  const reloadStudents = async () => {
    const { data } = await getCourseStudentsAPI(courseId)
    setStudents(data.data)
  }

  const handleSaveConfig = async (payload) => {
    try {
      const { data } = await updateGradingConfigAPI(courseId, payload)
      setGradingConfig(data.data)
      await reloadStudents()
      showToast('Configuração salva com sucesso.')
      return true
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao salvar configuração')
      return false
    }
  }

  const handleCreateAssessment = async (payload) => {
    try {
      const { data } = await createAssessmentAPI(courseId, payload)
      setAssessments(prev => [...prev, data.data])
      showToast('Avaliação criada com sucesso.')
      return true
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao criar avaliação')
      return false
    }
  }

  const handleUpdateAssessment = async (id, payload) => {
    try {
      const { data } = await updateAssessmentAPI(courseId, id, payload)
      setAssessments(prev => prev.map(a => a._id === id ? data.data : a))
      await reloadStudents()
      showToast('Avaliação atualizada com sucesso.')
      return true
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao atualizar avaliação')
      return false
    }
  }

  const handleDeleteAssessment = (assessment) => {
    confirm(`Excluir a avaliação "${assessment.title}"? As notas lançadas nela serão removidas.`, async () => {
      try {
        await deleteAssessmentAPI(courseId, assessment._id)
        setAssessments(prev => prev.filter(a => a._id !== assessment._id))
        setAssessmentScores(prev => prev.filter(s => String(s.assessment) !== String(assessment._id)))
        await reloadStudents()
        showToast('Avaliação removida com sucesso.')
      } catch (err) {
        showToast(err.response?.data?.message || 'Erro ao excluir avaliação')
      }
    })
  }

  const handleSaveScores = async (assessmentId, payload) => {
    try {
      const { data } = await saveScoresAPI(courseId, assessmentId, payload)
      setAssessments(prev => prev.map(a => a._id === assessmentId ? data.data.assessment : a))
      setAssessmentScores(prev => [
        ...prev.filter(s => String(s.assessment) !== String(assessmentId)),
        ...data.data.scores,
      ])
      await reloadStudents()
      showToast('Notas salvas com sucesso.')
      return true
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao salvar notas')
      return false
    }
  }

  const handleSetStatus = async (enrollmentId, payload) => {
    try {
      await updateSituationAPI(enrollmentId, payload)
      await reloadStudents()
      showToast('Situação atualizada com sucesso.')
      return true
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao atualizar situação')
      return false
    }
  }

  const handleReleaseCertificate = (enrollmentId, status) => {
    const emitir = status === 'emitido'
    // Emitir exige assinatura configurada no perfil de quem emite
    if (emitir && !hasSignature) {
      setSignatureWarnOpen(true)
      return
    }
    confirm(
      emitir
        ? 'Emitir o certificado deste aluno? Ele será notificado e poderá baixar o PDF.'
        : 'Revogar o certificado deste aluno? Ele voltará para "em análise".',
      async () => {
        setCertificateSavingId(enrollmentId)
        try {
          const { data } = await releaseCertificateAPI(enrollmentId, status)
          setStudents(prev =>
            prev.map(s => s._id === enrollmentId ? { ...s, certificateStatus: data.data.certificateStatus } : s)
          )
          showToast(emitir ? 'Certificado emitido' : 'Certificado revogado')
        } catch (err) {
          showToast(err.response?.data?.message || 'Erro ao atualizar certificado')
        } finally {
          setCertificateSavingId(null)
        }
      }
    )
  }

  const handlePreviewCertificate = async (enrollment) => {
    const name = enrollment.user?.name || 'Aluno'
    const studentId = enrollment.user?._id || enrollment.user
    // Abre o card imediatamente; o PDF é buscado em segundo plano (para os botões)
    setCertPreview({ open: true, url: null, name, enrollment })
    try {
      const res = await getCertificatePdfAPI(courseId, { studentId })
      const url = URL.createObjectURL(res.data)
      setCertPreview((prev) => (prev.open ? { ...prev, url } : prev))
    } catch (err) {
      showToast(await readBlobError(err, 'Não foi possível preparar o PDF do certificado'))
    }
  }

  const closeCertPreview = () => {
    setCertPreview((prev) => {
      if (prev.url) URL.revokeObjectURL(prev.url)
      return { open: false, url: null, name: '', enrollment: null }
    })
  }

  const downloadCertPreview = () => {
    if (!certPreview.url) return
    const a = document.createElement('a')
    a.href = certPreview.url
    a.download = `certificado-${certPreview.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // --- Handlers Config ---
  useEffect(() => {
    if (activeTab !== 'config' || !course) return

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
      .catch(() => showToast('Erro ao carregar usuários'))
      .finally(() => setConfigUsersLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, course?.professor])

  const handleGrantAccess = async (userId) => {
    try {
      const { data } = await addAllowedProfessorAPI(courseId, userId)
      setCourse(prev => ({ ...prev, allowedProfessors: data.data }))
      showToast('Acesso concedido com sucesso.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao conceder acesso')
    }
  }

  const handleRevokeAccess = (profId) => {
    confirm('Remover acesso deste professor?', async () => {
      try {
        await removeAllowedProfessorAPI(courseId, profId)
        setCourse(prev => ({ ...prev, allowedProfessors: prev.allowedProfessors.filter(p => p._id !== profId) }))
        showToast('Acesso removido com sucesso.')
      } catch {
        showToast('Erro ao remover acesso')
      }
    })
  }

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>
  if (loadError) return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <p className="text-text-secondary">{loadError}</p>
      <Button variant="secondary" onClick={() => navigate('/admin/cursos')}>Voltar para cursos</Button>
    </div>
  )
  if (!course) return null

  return (
    <div className="min-h-screen bg-surface-page pb-16">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

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
            <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="bg-white rounded-b-card border border-border border-t-0">

            {activeTab === 'aulas' && (
              <LessonsTab
                course={course}
                lessons={lessons}
                calendarDate={calendarDate}
                selectedCalendarDay={selectedCalendarDay}
                lessonsView={lessonsView}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                onSelectDay={setSelectedCalendarDay}
                onToggleView={toggleLessonsView}
                onOpenContent={(lesson) => setContentModal({ open: true, lesson })}
                onOpenExercises={(lesson) => setExerciseModal({ open: true, lesson })}
                onEditLesson={(lesson) => setLessonModal({ open: true, lesson })}
                onDeleteLesson={handleDeleteLesson}
              />
            )}

            {activeTab === 'alunos' && (
              <StudentsTab
                students={students}
                course={course}
                studentsView={studentsView}
                onToggleView={toggleStudentsView}
                certificateSavingId={certificateSavingId}
                onOpenStudent={(enrollment) => setStudentModal({ open: true, enrollment })}
                onReleaseCertificate={handleReleaseCertificate}
                onPreviewCertificate={handlePreviewCertificate}
              />
            )}

            {activeTab === 'avaliacoes' && (
              <AssessmentsTab
                config={gradingConfig}
                assessments={assessments}
                scores={assessmentScores}
                students={students}
                onSaveConfig={handleSaveConfig}
                onCreateAssessment={handleCreateAssessment}
                onUpdateAssessment={handleUpdateAssessment}
                onSaveScores={handleSaveScores}
                onSetStatus={handleSetStatus}
                onDeleteConfirm={handleDeleteAssessment}
              />
            )}

            {activeTab === 'material' && (
              <MaterialsTab
                materials={materials}
                onCreate={() => setMaterialModal({ open: true, material: null })}
                onEdit={(material) => setMaterialModal({ open: true, material })}
                onDelete={handleDeleteMaterial}
              />
            )}

            {activeTab === 'avisos' && (
              <AnnouncementsTab
                announcements={announcements}
                onCreate={() => setAnnouncementModal(true)}
                onDelete={handleDeleteAnnouncement}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardTab
                course={course}
                students={students}
                lessons={lessons}
                materials={materials}
                assessments={assessments}
                scores={assessmentScores}
                gradingConfig={gradingConfig}
              />
            )}

            {activeTab === 'feedbacks' && (
              <div>
                {/* Depoimentos dos alunos (sistema antigo) */}
                <FeedbacksTab feedbacks={courseFeedbacks} loading={courseFeedbacksLoading} />
                {/* Separador entre os dois tipos de feedback */}
                <div className="h-2 bg-surface-page border-y border-border" />
                {/* Formulário de feedback (sistema novo) */}
                <FeedbackTab courseId={courseId} course={course} />
              </div>
            )}

            {activeTab === 'config' && (
              <ConfigTab
                course={course}
                configUsers={configUsers}
                configUsersLoading={configUsersLoading}
                onGrantAccess={handleGrantAccess}
                onRevokeAccess={handleRevokeAccess}
              />
            )}

          </div>
        </div>
      </div>

      {/* --- Modal do Curso --- */}
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
      <LessonModal
        open={lessonModal.open}
        lesson={lessonModal.lesson}
        onClose={() => setLessonModal({ open: false, lesson: null })}
        onSave={handleSaveLesson}
        saving={lessonSaveLoading}
      />
      <LessonContentModal
        open={contentModal.open}
        lesson={contentModal.lesson}
        onClose={() => setContentModal({ open: false, lesson: null })}
        onSave={handleSaveContent}
        saving={contentSaving}
      />
      <LessonExerciseModal
        open={exerciseModal.open}
        lesson={exerciseModal.lesson}
        onClose={() => setExerciseModal({ open: false, lesson: null })}
        onSave={handleSaveExercises}
        saving={exerciseSaving}
      />

      {/* --- Modal de detalhe do aluno (notas por avaliação, somente leitura) --- */}
      <StudentDetailModal
        open={studentModal.open}
        enrollment={studentModal.enrollment}
        assessments={assessments}
        scores={assessmentScores}
        config={gradingConfig}
        onClose={() => setStudentModal({ open: false, enrollment: null })}
      />

      {/* --- Modal de Material --- */}
      <MaterialModal
        open={materialModal.open}
        material={materialModal.material}
        onClose={() => setMaterialModal({ open: false, material: null })}
        onSave={handleSaveMaterial}
        saving={materialSaveLoading}
      />

      {/* --- Modal de Aviso --- */}
      <AnnouncementModal
        open={announcementModal}
        students={students}
        onClose={() => setAnnouncementModal(false)}
        onSave={handleCreateAnnouncement}
        saving={announcementSaveLoading}
      />

      {/* --- Modal de pré-visualização do certificado (admin) --- */}
      <Modal open={certPreview.open} onClose={closeCertPreview} title={`Certificado — ${certPreview.name}`} size="lg">
        {certPreview.enrollment && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="secondary"
                className="text-sm"
                onClick={() => certPreview.url && window.open(certPreview.url, '_blank')}
                disabled={!certPreview.url}
              >
                <ExternalLink size={15} /> Abrir em outra página
              </Button>
              <Button variant="primary" className="text-sm" onClick={downloadCertPreview} disabled={!certPreview.url}>
                <Download size={15} /> Baixar PDF
              </Button>
            </div>
            <CertificateCard
              studentName={certPreview.enrollment.user?.name}
              course={course}
              lessons={lessons}
              issuedAt={certPreview.enrollment.certificateIssuedAt}
              enrollmentId={certPreview.enrollment._id}
              signatureText={certPreview.enrollment.certificateSignature?.text || user?.signature?.text}
              signatureFont={certPreview.enrollment.certificateSignature?.font || user?.signature?.font}
              signerName={certPreview.enrollment.certificateSignature?.name || user?.name}
            />
          </div>
        )}
      </Modal>

      {/* --- Aviso: precisa de assinatura para emitir certificado --- */}
      <Modal open={signatureWarnOpen} onClose={() => setSignatureWarnOpen(false)} title="Assinatura necessária" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Para emitir certificados, você precisa primeiro criar sua <strong>assinatura</strong>.
            Ela aparecerá no certificado dos alunos.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            Você pode configurá-la em <strong>Meu Perfil</strong>, na seção
            <strong> “Assinatura do certificado”</strong>.
          </p>
          <div className="flex flex-wrap gap-3 justify-end pt-1">
            <Button variant="secondary" onClick={() => setSignatureWarnOpen(false)}>
              Agora não
            </Button>
            <Button variant="primary" onClick={() => { setSignatureWarnOpen(false); navigate('/meu-perfil') }}>
              Criar assinatura
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- Modal de confirmação genérico + Toast --- */}
      <ConfirmModal confirmModal={confirmModal} onClose={closeConfirm} onConfirm={handleConfirm} />
      <Toast show={toast.show} message={toast.message} onClose={closeToast} />
    </div>
  )
}

export default AdminCourse
