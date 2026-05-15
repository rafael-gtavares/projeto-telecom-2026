import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Calendar, User, XCircle, MapPin, ChevronRight } from 'lucide-react'
import Header from '../components/layout/Header'
import { Tabs, Badge, Spinner } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import { getMyEnrollmentsAPI } from '../api/courses'
import { formatDate } from '../utils/formatDate'
import CourseDetailModal from '../components/courses/CourseDetailModal'

const tabs = [
  { value: 'inscrito', label: 'Inscritos' },
  { value: 'concluido', label: 'Concluídos' },
]

const statusBadge = {
  inscrito: { variant: 'blue', label: 'Inscrição Confirmada' },
  ativo: { variant: 'success', label: 'Em Andamento' },
  concluido: { variant: 'gray', label: 'Concluído' },
}

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const MyCourses = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('inscrito')
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const filtered = enrollments.filter(e => e.status === activeTab)

  const handleOpenModal = (course) => {
    setSelectedCourse(course)
    setIsModalOpen(true)
  }

  const handleCancelSuccess = (courseId) => {
    setEnrollments(prev => prev.filter(e => e.course._id !== courseId))
    setIsModalOpen(false)
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
            <div className="px-4 pt-2 border-b border-border bg-white rounded-t-card">
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
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
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map(({ _id, course, status }) => {
                    if (!course) return null
                    const { variant, label } = statusBadge[status] || {}
                    
                    // Resumo dos dias (Ex: "Segunda, Quarta")
                    const daysSummary = course.schedule?.map(s => s.dayOfWeek).join(', ')
                    // Local da primeira sessão
                    const mainLocation = course.schedule?.[0]?.location || 'A definir'

                    return (
                      <div key={_id} className="group relative flex flex-col md:flex-row gap-6 p-5 bg-white border border-border rounded-xl hover:shadow-md hover:border-primary/30 transition-all">
                        
                        {/* Imagem/Capa */}
                        <div className="w-full md:w-32 h-32 md:h-auto rounded-lg bg-surface-hover flex-shrink-0 overflow-hidden relative border border-border/50">
                          {course.imageUrl ? (
                            <img src={`${apiBase}${course.imageUrl}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/30 bg-primary/5"><BookOpen size={32} /></div>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="font-black text-text-primary text-xl leading-tight mb-1 group-hover:text-primary transition-colors truncate">
                              {course.title}
                            </h3>
                            <p className="text-sm text-text-secondary font-medium flex items-center gap-1.5 mb-4">
                              <User size={14} className="text-primary" />
                              Prof. {course.professor}
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
                                <Clock size={12} /> Dias
                              </span>
                              <p className="text-xs font-semibold text-text-primary truncate" title={daysSummary}>
                                {daysSummary || 'Não definido'}
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
                          <button
                            onClick={() => handleOpenModal(course)}
                            className="btn-primary text-[13px] py-2 px-4 w-full flex items-center justify-center gap-2"
                          >
                            Ver Detalhes
                          </button>

                          {status !== 'concluido' && (
                            <button
                              onClick={() => handleOpenModal(course)}
                              className="border border-red-200 btn-ghost text-error hover:bg-error-light text-[13px] py-2 px-4 w-full flex items-center justify-center gap-2 transition-colors"
                            >
                              <XCircle size={14} />
                              Cancelar
                            </button>
                          )}
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

      <CourseDetailModal 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourse}
        onCancelSuccess={handleCancelSuccess}
        onEnrollSuccess={fetchEnrollments}
      />
    </div>
  )
}

export default MyCourses