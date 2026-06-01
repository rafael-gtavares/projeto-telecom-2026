import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, Users, LogIn, CheckCircle, XCircle, MapPin, Info } from 'lucide-react'
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
  // Lógica para verificar se o curso dura mais de um dia
  const isMultiDay = new Date(course.startDate).toDateString() !== new Date(course.endDate).toDateString()

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
        {/* Banner com Imagem */}
        <div className="relative h-[200px] bg-gradient-to-br from-primary to-primary-light flex flex-col justify-end p-6 -mx-6 -mt-5 mb-6 rounded-t-sm overflow-hidden">
          {course.imageUrl && (
            <>
              <img
                src={course.imageUrl}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </>
          )}

          <div className="absolute top-4 right-4 z-10">
            <Badge variant={course.status === 'published' ? 'blue' : 'gray'}>
              {course.status === 'published' ? 'Inscrições Abertas' : 'Encerrado'}
            </Badge>
          </div>

          <div className="relative z-10">
            <h2 className="text-white font-bold text-2xl leading-tight drop-shadow-md">{course.title}</h2>
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
            <Info size={16} /> Sobre o curso
          </h3>
          <p className="text-text-secondary text-sm leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Grid de Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-surface-hover rounded-lg border border-border">
            <Calendar size={20} className="text-primary" />
            <div>
              <p className="text-xs text-text-muted font-medium uppercase">Duração / Data</p>
              <p className="text-sm font-semibold text-text-primary">
                {isMultiDay
                  ? `${formatDate(course.startDate)} até ${formatDate(course.endDate)}`
                  : formatDate(course.startDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface-hover rounded-lg border border-border">
            <User size={20} className="text-primary" />
            <div>
              <p className="text-xs text-text-muted font-medium uppercase">Professor</p>
              <p className="text-sm font-semibold text-text-primary">{course.professor?.name || course.professor || 'A definir'}</p>
            </div>
          </div>
        </div>

        {/* Modalidade e Local */}
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
            <Clock size={16} /> Modalidade e Local
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 p-3 bg-white border border-border rounded-lg flex-1 min-w-[140px]">
              <Clock size={16} className="text-primary" />
              <span className="text-sm font-semibold text-text-primary capitalize">
                {course.modality?.replace('_', ' ') || 'Presencial'}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white border border-border rounded-lg flex-1 min-w-[140px]">
              <MapPin size={16} className="text-primary" />
              <span className="text-sm font-semibold text-text-primary">
                {course.location || 'A definir'}
              </span>
            </div>
          </div>
        </div>

        {/* Vagas e Ocupação */}
        <div className="bg-surface-secondary p-4 rounded-xl border border-border mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <span className="text-sm font-bold text-text-primary">Disponibilidade</span>
            </div>
            <span className="text-sm font-semibold text-primary">{course.enrolledCount} / {course.maxSlots} vagas</span>
          </div>
          <div className="bg-border h-2 rounded-full overflow-hidden w-full">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-error' : 'bg-primary'}`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
          {isFull && <p className="text-[11px] text-error mt-1 font-medium">* Vagas esgotadas para este curso.</p>}
        </div>

        {/* Rodapé de Ações */}
        <div className="border-t border-border pt-5">
          {enrollmentStatus === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Spinner size="sm" className="mb-2" />
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
              <p className="text-sm text-text-primary font-medium">Deseja participar deste curso?</p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="primary" size="sm" onClick={() => { onClose(); navigate('/login'); }}>Entrar</Button>
                <Button variant="secondary" size="sm" onClick={() => { onClose(); navigate('/cadastro'); }}>Criar Conta</Button>
              </div>
            </div>
          ) : enrollmentStatus === 'enrolled' ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-success/10 py-3 px-10 rounded-lg border border-success/20">
                <div className="flex items-center gap-2 text-success font-bold text-sm">
                  <CheckCircle size={18} /> Inscrição confirmada
                </div>
                {!confirmCancel && (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="
                      w-auto
                      mt-3
                      p-3
                      rounded-xl
                      text-sm
                      font-semibold
                      text-error
                      bg-red-500/5
                      border border-red-500/10
                      hover:bg-red-500/10
                      transition-all
                    "
                  >
                    Cancelar inscrição?
                  </button>
                )}
              </div>

              {confirmCancel && (
                <div className="bg-error/5 p-4 rounded-lg border border-error/20 animate-fadeIn">
                  <p className="text-xs text-text-primary mb-3 text-center">Ao cancelar, sua vaga será liberada imediatamente. Confirmar?</p>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      className="
                        flex-1
                        justify-center
                        py-3
                        rounded-xl
                        text-sm
                        font-semibold
                        border border-red-500/20
                        bg-red-500/5
                        text-error
                        hover:bg-red-500/10
                        transition-all
                      "
                      loading={actionLoading}
                      onClick={handleCancel}
                    >
                      Confirmar Cancelamento
                    </Button>

                    <Button
                      variant="secondary"
                      className="
                        flex-1
                        py-3
                        rounded-xl
                        text-sm
                        font-semibold
                        transition-all
                      "
                      onClick={() => setConfirmCancel(false)}
                    >
                      Voltar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-4">
              <Button
                variant="primary"
                className="flex-1 py-4 text-lg"
                disabled={isFull || course.status === 'closed'}
                loading={actionLoading}
                onClick={handleEnroll}
              >
                {course.status === 'closed' ? 'Encerrado' : isFull ? 'Vagas Esgotadas' : 'Quero me inscrever'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ show: false })} />
    </>
  )
}

export default CourseDetailModal