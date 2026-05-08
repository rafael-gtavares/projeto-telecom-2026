import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, Users, LogIn, CheckCircle, XCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Badge, Spinner } from '../ui/index'
import Toast from '../ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { enrollAPI, checkEnrollmentAPI, cancelEnrollmentAPI } from '../../api/courses'
import { formatDate } from '../../utils/formatDate'

const CourseDetailModal = ({ open, onClose, course, onEnrollSuccess, onCancelSuccess }) => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [enrollmentStatus, setEnrollmentStatus] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    if (!open || !course) return

    setConfirmCancel(false)

    if (!isAuthenticated) {
      setEnrollmentStatus(null)
      return
    }

    const checkStatus = async () => {
      try {
        setEnrollmentStatus('loading')
        const { data } = await checkEnrollmentAPI(course._id)
        setEnrollmentStatus(data.data.enrolled ? 'enrolled' : 'not_enrolled')
      } catch (error) {
        setEnrollmentStatus('not_enrolled')
      }
    }

    checkStatus()
  }, [open, course, isAuthenticated])

  if (!course) return null

  const slots = course.availableSlots ?? (course.maxSlots - course.enrolledCount)
  const isFull = slots <= 0
  const occupancyPercent = Math.min(100, (course.enrolledCount / course.maxSlots) * 100)
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const handleEnroll = async () => {
    try {
      setActionLoading(true)
      await enrollAPI(course._id)
      onEnrollSuccess(course._id)
      onClose()
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || 'Erro ao se inscrever' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      setActionLoading(true)
      await cancelEnrollmentAPI(course._id)
      onCancelSuccess(course._id)
      onClose()
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || 'Erro ao cancelar inscrição' })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg" title="Detalhes do Curso">
        {/* Topo do modal (imagem de capa) com negative margin para ignorar o padding do modal */}
        <div className="relative h-[180px] bg-gradient-to-br from-primary to-primary-light flex flex-col justify-end p-6 -mx-6 -mt-5 mb-5 rounded-t-sm overflow-hidden">
          {course.imageUrl && (
            <>
              <img
                src={`${apiBase}${course.imageUrl}`}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </>
          )}
          
          <div className="absolute top-4 right-4 z-10">
            <Badge variant={course.status === 'published' ? 'blue' : 'gray'}>
              {course.status === 'published' ? 'Publicado' : 'Encerrado'}
            </Badge>
          </div>

          <div className="relative z-10">
            <h2 className="text-white font-bold text-xl md:text-2xl leading-tight">{course.title}</h2>
          </div>
        </div>

        {/* Corpo do modal */}
        <p className="text-text-secondary text-sm leading-relaxed mb-6">
          {course.description}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar size={16} className="text-primary flex-shrink-0" />
            <span>{formatDate(course.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock size={16} className="text-primary flex-shrink-0" />
            <span>{course.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <User size={16} className="text-primary flex-shrink-0" />
            <span>{course.professor || 'A definir'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Users size={16} className="text-primary flex-shrink-0" />
            <span>{slots} {slots === 1 ? 'vaga restante' : 'vagas restantes'}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span>Ocupação das vagas</span>
            <span>{course.enrolledCount} de {course.maxSlots}</span>
          </div>
          <div className="bg-border h-1.5 rounded-full overflow-hidden w-full">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-500" 
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* Seção de ação */}
        <div className="border-t border-border pt-4">
          {enrollmentStatus === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Spinner size="md" className="mb-2" />
              <p className="text-sm text-text-secondary">Verificando sua inscrição...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="bg-surface-blue rounded-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <LogIn size={20} className="text-primary" />
                <p className="text-sm font-medium text-text-primary">Faça login para se inscrever neste curso</p>
              </div>
              <div className="flex gap-3">
                <Button variant="primary" className="flex-1" onClick={() => { onClose(); navigate('/login'); }}>
                  Entrar
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => { onClose(); navigate('/cadastro'); }}>
                  Criar conta
                </Button>
              </div>
            </div>
          ) : enrollmentStatus === 'enrolled' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="success" className="gap-1.5 px-3 py-1.5">
                  <CheckCircle size={14} /> Você já está inscrito
                </Badge>
                <Button variant="ghost" className="text-error hover:bg-error-light gap-1.5" onClick={() => setConfirmCancel(true)}>
                  <XCircle size={16} /> Cancelar inscrição
                </Button>
              </div>

              {confirmCancel && (
                <div className="bg-error-light/50 border border-error-light rounded-card p-4 animate-fadeIn">
                  <p className="text-sm text-text-primary mb-3">Tem certeza? Sua vaga será liberada para outra pessoa.</p>
                  <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1 text-error hover:bg-error/10" loading={actionLoading} onClick={handleCancel}>
                      Sim, cancelar
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={() => setConfirmCancel(false)} disabled={actionLoading}>
                      Manter inscrição
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              {course.status === 'closed' ? (
                <>
                  <Badge variant="gray">Inscrições encerradas</Badge>
                  <Button variant="primary" className="flex-1 max-w-[200px]" disabled>
                    Inscrições encerradas
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant={isFull ? "gray" : "blue"}>
                    {isFull ? 'Vagas esgotadas' : `${slots} ${slots === 1 ? 'vaga' : 'vagas'} restantes`}
                  </Badge>
                  <Button 
                    variant="primary" 
                    className="flex-1 max-w-[240px]" 
                    disabled={isFull} 
                    loading={actionLoading}
                    onClick={handleEnroll}
                  >
                    {isFull ? 'Sem vagas disponíveis' : 'Confirmar inscrição'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false })}
      />
    </>
  )
}

export default CourseDetailModal
