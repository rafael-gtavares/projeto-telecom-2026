import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Download, CheckCircle, Clock, Calendar } from 'lucide-react'
import Header from '../components/layout/Header'
import { Tabs, Badge, Spinner } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import { getMyEnrollmentsAPI } from '../api/courses'
import { formatDate } from '../utils/formatDate'

const tabs = [
  { value: 'inscrito', label: 'Inscritos' },
  // { value: 'ativo', label: 'Em andamento' },
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

  useEffect(() => {
    getMyEnrollmentsAPI()
      .then(r => setEnrollments(r.data.data))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = enrollments.filter(e => e.status === activeTab)

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <div className="page-container">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Meus Cursos</h1>
            <p className="text-text-secondary text-sm mt-1">Olá, {user?.name?.split(' ')[0]} 👋</p>
          </div>

          <div className="card overflow-x-none">
            <div className="px-4 pt-4 border-b border-border overflow-hidden [&_div]:overflow-y-hidden">
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </div>

            <div className="p-4 md:p-6">
              {loading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 rounded-full bg-surface-page flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={28} className="text-text-muted" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1">Nenhum curso aqui</h3>
                  <p className="text-text-secondary text-sm mb-5">Você ainda não possui cursos nesta categoria.</p>
                  <Link to="/#cursos">
                    <button className="btn-primary px-6 py-2.5 text-sm">Explorar cursos</button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(({ _id, course, status }) => {
                    if (!course) return null
                    const { variant, label } = statusBadge[status] || {}
                    return (
                      <div key={_id} className="flex gap-4 p-4 border border-border rounded-card hover:border-primary hover:shadow-card transition-all">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary-light flex-shrink-0 overflow-hidden">
                          {course.imageUrl && <img src={`${apiBase}${course.imageUrl}`} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <h3 className="font-semibold text-text-primary text-sm leading-tight">{course.title}</h3>
                            <Badge variant={variant}>{label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-text-muted">
                              <Calendar size={11} />{formatDate(course.date)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-text-muted">
                              <Clock size={11} />{course.time}
                            </span>
                          </div>
                          {status === 'ativo' && (
                            <div className="mt-2">
                              <div className="h-1.5 bg-border rounded-full overflow-hidden w-40">
                                <div className="h-full bg-success rounded-full" style={{ width: '45%' }} />
                              </div>
                              <p className="text-xs text-text-muted mt-0.5">45% concluído</p>
                            </div>
                          )}
                          {status === 'concluido' && (
                            <button className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline font-medium">
                              <Download size={12} /> Baixar certificado
                            </button>
                          )}
                        </div>
                        {status === 'concluido' && <CheckCircle size={18} className="text-success flex-shrink-0 mt-0.5" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyCourses
