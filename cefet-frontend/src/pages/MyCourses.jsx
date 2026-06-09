import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Clock, Calendar, User, XCircle, MapPin, ChevronRight, AlertTriangle, LayoutList, LayoutGrid } from 'lucide-react'
import Header from '../components/layout/Header'
import { Tabs, Badge, Spinner } from '../components/ui/index'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { getMyEnrollmentsAPI, cancelEnrollmentAPI } from '../api/courses'
import { formatDate } from '../utils/formatDate'
import { formatModality } from '../utils/formatModality'

const tabs = [
  { value: 'inscritos', label: 'Inscritos' },
  { value: 'concluido', label: 'Concluídos' },
]

const statusBadge = {
  inscrito: { variant: 'blue', label: 'Aguardando Início' },
  ativo: { variant: 'success', label: 'Cursando' },
  concluido: { variant: 'gray', label: 'Concluído' },
}


const MyCourses = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('inscritos')
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState({ open: false, enrollment: null })
  const [cancelling, setCancelling] = useState(false)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('myCoursesView') || 'list')

  const toggleView = (mode) => {
    setViewMode(mode)
    localStorage.setItem('myCoursesView', mode)
  }

  const fetchEnrollments = () => {
    setLoading(true)
    getMyEnrollmentsAPI()
      .then(r => setEnrollments(r.data.data))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEnrollments()
  }, [])

  const filtered = enrollments.filter(e => {
    if (activeTab === 'inscritos') return e.status === 'inscrito' || e.status === 'ativo'
    return e.status === activeTab
  })

  const handleConfirmCancel = async () => {
    if (!cancelModal.enrollment) return
    setCancelling(true)
    try {
      await cancelEnrollmentAPI(cancelModal.enrollment.course._id)
      setEnrollments(prev => prev.filter(e => e._id !== cancelModal.enrollment._id))
      setCancelModal({ open: false, enrollment: null })
    } catch {
      // silencia erro — o usuário pode tentar novamente
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <div className="page-container">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Meus Cursos</h1>
            <p className="text-text-secondary mt-1">Bem-vindo de volta, <span className="font-semibold text-primary">{user?.name?.split(' ')[0]}</span></p>
          </div>

          <div className="card shadow-sm border-none bg-transparent md:bg-white overflow-hidden">
            <div className="px-4 pt-2 border-b border-border bg-white rounded-t-card flex items-center justify-between gap-3">
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

              {/* Toggle lista / card */}
              <div className="flex items-center gap-1 flex-shrink-0 mb-1 p-1 bg-surface-page rounded-lg border border-border">
                <button
                  onClick={() => toggleView('list')}
                  title="Visualização em lista"
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
                >
                  <LayoutList size={16} />
                </button>
                <button
                  onClick={() => toggleView('grid')}
                  title="Visualização em cards"
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>

            <div className="py-6">
              {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-b-card border border-border md:border-none">
                  <div className="w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={32} className="text-text-muted" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Nada por aqui ainda</h3>
                  <p className="text-text-secondary text-sm mb-8 max-w-xs mx-auto">Você não tem cursos {activeTab === 'inscrito' ? 'ativos' : 'concluídos'} no momento.</p>
                  <Link to="/#cursos" className="flex justify-center">
                    <button className="btn-primary px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20">Explorar Catálogo</button>
                  </Link>
                </div>
              ) : viewMode === 'list' ? (
                /* ── MODO LISTA ── */
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map(({ _id, course, status }) => {
                    if (!course) return null
                    const { variant, label } = statusBadge[status] || {}
                    const mainLocation = course.location || 'A definir'

                    return (
                      <div key={_id} className="group relative flex flex-col md:flex-row gap-6 p-5 mx-6 bg-white border border-border rounded-xl hover:shadow-md hover:border-primary/30 transition-all">

                        {/* Imagem/Capa */}
                        <div className="w-full md:w-32 h-32 md:h-auto rounded-lg bg-surface-hover flex-shrink-0 overflow-hidden relative border border-border/50">
                          {course.imageUrl ? (
                            <img src={course.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/30 bg-primary/5"><BookOpen size={32} /></div>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-black text-text-primary text-xl leading-tight group-hover:text-primary transition-colors truncate">
                                {course.title}
                              </h3>
                              {variant && <Badge variant={variant} className="flex-shrink-0 mt-0.5">{label}</Badge>}
                            </div>
                            <p className="text-sm text-text-secondary font-medium flex items-center gap-1.5 mb-4">
                              <User size={14} className="text-primary" />
                              {course.instructor || course.professor?.name || '—'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-border/50 pt-4">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1">
                                <Calendar size={12} /> Período
                              </span>
                              <p className="text-xs font-semibold text-text-primary">
                                {formatDate(course.startDate)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1">
                                <Clock size={12} /> Modalidade
                              </span>
                              <p className="text-xs font-semibold text-text-primary truncate">
                                {formatModality(course.modality)}
                              </p>
                            </div>
                            <div className="hidden md:block space-y-1">
                              <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1">
                                <MapPin size={12} /> Local
                              </span>
                              <p className="text-xs font-semibold text-text-primary truncate">
                                {mainLocation}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* AÇÕES LATERAIS */}
                        <div className="flex md:flex-col justify-center items-stretch gap-3 mt-4 md:mt-0 md:pl-6 md:border-l md:border-border min-w-[140px]">
                          {(status === 'ativo' || status === 'concluido') ? (
                            <Button
                              variant="primary"
                              className="text-[13px] py-2 px-4 w-full"
                              onClick={() => navigate(`/meu-curso/${course._id}`)}
                            >
                              {status === 'concluido' ? 'Ver curso' : 'Acessar curso'}
                              <ChevronRight size={14} />
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              className="text-[13px] py-2 px-4 w-full"
                              onClick={() => navigate(`/meu-curso/${course._id}`)}
                            >
                              Ver Detalhes
                            </Button>
                          )}

                          {status !== 'concluido' && (
                            <Button
                              variant="ghost"
                              className="text-[13px] py-2 px-4 w-full border border-error/20"
                              onClick={() => setCancelModal({ open: true, enrollment: { _id, course } })}
                            >
                              <XCircle size={14} />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* ── MODO GRID (CARDS) ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
                  {filtered.map(({ _id, course, status }) => {
                    if (!course) return null
                    const { variant, label } = statusBadge[status] || {}

                    return (
                      <div key={_id} className="group flex flex-col bg-white border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all">

                        {/* Capa */}
                        <div className="relative h-36 bg-gradient-to-br from-primary to-primary-light flex-shrink-0 overflow-hidden">
                          {course.imageUrl ? (
                            <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={32} className="text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20" />
                          {variant && (
                            <div className="absolute top-2 right-2">
                              <Badge variant={variant}>{label}</Badge>
                            </div>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-text-primary text-base leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-xs text-text-muted flex items-center gap-1 mb-3">
                            <User size={12} className="text-primary flex-shrink-0" />
                            <span className="truncate">{course.instructor || course.professor?.name || '—'}</span>
                          </p>

                          <div className="space-y-1.5 mb-4 flex-1">
                            <p className="text-xs text-text-muted flex items-center gap-1.5">
                              <Calendar size={12} className="text-primary flex-shrink-0" />
                              {formatDate(course.startDate)}
                            </p>
                            <p className="text-xs text-text-muted flex items-center gap-1.5">
                              <Clock size={12} className="text-primary flex-shrink-0" />
                              {formatModality(course.modality)}
                            </p>
                            {course.location && (
                              <p className="text-xs text-text-muted flex items-center gap-1.5">
                                <MapPin size={12} className="text-primary flex-shrink-0" />
                                <span className="truncate">{course.location}</span>
                              </p>
                            )}
                          </div>

                          {/* Ações */}
                          <div className="flex flex-col gap-2 pt-3 border-t border-border">
                            {(status === 'ativo' || status === 'concluido') ? (
                              <Button
                                variant="primary"
                                className="w-full text-sm py-2"
                                onClick={() => navigate(`/meu-curso/${course._id}`)}
                              >
                                {status === 'concluido' ? 'Ver curso' : 'Acessar curso'}
                                <ChevronRight size={14} />
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                className="w-full text-sm py-2"
                                onClick={() => navigate(`/meu-curso/${course._id}`)}
                              >
                                Ver Detalhes
                              </Button>
                            )}
                            {status !== 'concluido' && (
                              <button
                                onClick={() => setCancelModal({ open: true, enrollment: { _id, course } })}
                                className="w-full text-xs text-error/70 hover:text-error transition-colors py-1"
                              >
                                Cancelar inscrição
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de cancelamento */}
      <Modal
        open={cancelModal.open}
        onClose={() => !cancelling && setCancelModal({ open: false, enrollment: null })}
        title="Cancelar inscrição"
        size="sm"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-error-light flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-error" />
          </div>
          <div>
            <p className="text-text-primary font-medium text-sm">
              Tem certeza que deseja cancelar a inscrição em{' '}
              <strong>"{cancelModal.enrollment?.course?.title}"</strong>?
            </p>
            <p className="text-text-muted text-xs mt-1">
              Esta ação não pode ser desfeita. Você perderá sua vaga e precisará se inscrever novamente.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-error hover:bg-error-text border-0"
            loading={cancelling}
            onClick={handleConfirmCancel}
          >
            <XCircle size={14} />
            Confirmar cancelamento
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCancelModal({ open: false, enrollment: null })}
            disabled={cancelling}
          >
            Manter
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default MyCourses