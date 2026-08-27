import { Calendar, Clock, User, Users, CheckCircle, MapPin, Hourglass, Send, X } from 'lucide-react'
import { Badge } from '../ui/index'
import Button from '../ui/Button'
import { formatDate } from '../../utils/formatDate'
import { formatModality } from '../../utils/formatModality'

const CARD_GRADIENT = 'from-primary to-primary-light'

const EventCard = ({ course, onOpenModal, onCancelRequest, cancelingRequest }) => {
  const isEnrolled = course.isEnrolled ?? false
  const isWaitlisted = course.isWaitlisted ?? false
  const isPendingRequest = course.isPendingRequest ?? false
  const isVacanciesClosed = course.status === 'vagas_encerradas'

  const slots = course.availableSlots ?? (course.maxSlots - course.enrolledCount)
  const isFull = slots <= 0
  const isOneDay = course.startDate?.slice(0, 10) === course.endDate?.slice(0, 10)
  const mainLocation = course.location || 'A definir'

  return (
    <div
      className="card overflow-hidden flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 ease"
      onClick={() => onOpenModal(course)}
    >
      <div className={`relative h-[160px] bg-gradient-to-br ${CARD_GRADIENT} flex flex-col items-center justify-center p-4`}>
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

        <div className="relative z-10 text-center">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1 drop-shadow-md">Curso</p>
          <h3 className="text-white font-bold text-base leading-tight line-clamp-2 px-2 drop-shadow-lg">{course.title}</h3>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-text-secondary text-sm line-clamp-2 mb-3 flex-1">{course.description}</p>

        <div className="space-y-1.5 mb-3">
          {/* Datas: Mostra intervalo ou dia único */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Calendar size={13} className="text-primary flex-shrink-0" />
            <span>
              {isOneDay
                ? formatDate(course.startDate)
                : `${formatDate(course.startDate)} - ${formatDate(course.endDate)}`
              }
            </span>
          </div>

          {/* Horários e Dias */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock size={13} className="text-primary flex-shrink-0" />
            <span className="truncate">{formatModality(course.modality)}</span>
          </div>

          {/* Localização (Nova!) */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <MapPin size={13} className="text-primary flex-shrink-0" />
            <span className="truncate">{mainLocation}</span>
          </div>

          {/* Instrutor / Palestrante */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <User size={13} className="text-primary flex-shrink-0" />
            <span className="truncate">{course.instructor || course.professor?.name || 'A definir'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          {isFull
            ? <Badge variant="gray"><Users size={11} className="mr-1" />Vagas esgotadas</Badge>
            : <Badge variant="blue"><Users size={11} className="mr-1" />{slots} {slots === 1 ? 'vaga' : 'vagas'} restantes</Badge>
          }
        </div>

        <Button
          variant={(isEnrolled || isWaitlisted || isPendingRequest || isVacanciesClosed) ? 'secondary' : 'primary'}
          disabled={isVacanciesClosed && !isEnrolled && !isWaitlisted && !isPendingRequest}
          className={`w-full text-sm py-2.5 ${isEnrolled ? 'border-green-500/50 text-green-600' : isWaitlisted ? 'border-warning/50 text-warning-text' : isPendingRequest ? 'border-primary/50 text-primary' : ''}`}
        >
          {isEnrolled ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-green-500" /> Já estou inscrito
            </span>
          ) : isWaitlisted ? (
            <span className="flex items-center justify-center gap-2">
              <Hourglass size={16} /> Na fila de espera
            </span>
          ) : isPendingRequest ? (
            <span className="flex items-center justify-center gap-2">
              <Hourglass size={16} /> Solicitação em análise
            </span>
          ) : isVacanciesClosed ? (
            <span className="flex items-center justify-center gap-2">
              <X size={16} /> Vagas encerradas
            </span>
          ) : isFull ? (
            'Entrar na fila de espera'
          ) : course.enrollmentType === 'approval' ? (
            <span className="flex items-center justify-center gap-2">
              <Send size={16} /> Solicitar vaga
            </span>
          ) : (
            'Inscrever-se'
          )}
        </Button>

        {/* Aviso: vaga só com desistência */}
        {isFull && !isVacanciesClosed && !isEnrolled && !isPendingRequest && course.enrollmentType !== 'approval' && (
          <p className="text-[11px] text-text-muted text-center mt-2">
            {isWaitlisted
              ? 'Você assume a vaga somente se houver desistência.'
              : 'Sem vagas — você só fará o curso se houver desistência.'}
          </p>
        )}
      </div>
    </div>
  )
}

export default EventCard