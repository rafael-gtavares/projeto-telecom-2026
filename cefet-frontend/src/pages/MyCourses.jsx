import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle, Clock, Calendar, User, XCircle } from 'lucide-react'
import Header from '../components/layout/Header'
import { Tabs, Badge, Spinner } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import { getMyEnrollmentsAPI } from '../api/courses'
import { formatDate } from '../utils/formatDate'
import CourseDetailModal from '../components/courses/CourseDetailModal' // <--- Importe o Modal

const tabs = [
  { value: 'inscrito', label: 'Inscritos' },
  { value: 'concluido', label: 'Concluídos' },
]

const statusBadge = {
  inscrito: { variant: 'blue', label: 'Aguardando início' },
  ativo: { variant: 'success', label: 'Ativo' },
  concluido: { variant: 'gray', label: 'Concluído' },
}

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const MyCourses = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('inscrito')
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  
  // ESTADOS PARA O MODAL
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

  // Função para remover o curso da lista visualmente após cancelar
  const handleCancelSuccess = (courseId) => {
    setEnrollments(prev => prev.filter(e => e.course._id !== courseId))
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <div className="page-container">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Meus Cursos</h1>
            <p className="text-text-secondary text-sm mt-1">Olá, {user?.name?.split(' ')[0]}!</p>
          </div>

          <div className="card overflow-x-none">
            <div className="px-4 pt-4 border-b border-border overflow-hidden">
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </div>

            <div className="p-4 md:p-6">
              {loading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-surface-page flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={28} className="text-text-muted" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1">Nenhum curso aqui</h3>
                  <p className="text-text-secondary text-sm mb-5">Você ainda não possui cursos nesta categoria.</p>
                  <Link to="/#cursos">
                    <button className="btn-primary px-6 py-2.5 text-sm mt-3">Explorar cursos</button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(({ _id, course, status }) => {
                    if (!course) return null
                    const { variant, label } = statusBadge[status] || {}

                    return (
                      <div key={_id} className="flex flex-col md:flex-row gap-4 p-5 border border-border rounded-card hover:border-primary/50 hover:shadow-sm transition-all bg-white group">
                        
                        <div className="w-full md:w-24 h-24 rounded-lg bg-gradient-to-br from-primary/10 to-primary flex-shrink-0 overflow-hidden border border-border">
                          {course.imageUrl ? (
                            <img src={`${apiBase}${course.imageUrl}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/40"><BookOpen size={32} /></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="font-bold text-text-primary text-base leading-snug group-hover:text-primary transition-colors">
                                {course.title}
                              </h3>
                              <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                                <User size={12} className="text-primary" />
                                Prof. {course.professor || 'A definir'}
                              </p>
                            </div>
                            <Badge variant={variant} className="whitespace-nowrap">{label}</Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                              <Calendar size={13} className="text-primary" />
                              {formatDate(course.date)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                              <Clock size={13} className="text-primary" />
                              {course.time}
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

      {/* COMPONENTE DO MODAL */}
      <CourseDetailModal 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourse}
        onCancelSuccess={handleCancelSuccess}
        onEnrollSuccess={fetchEnrollments} // Recarrega se ele se inscrever por algum motivo
      />
    </div>
  )
}

export default MyCourses