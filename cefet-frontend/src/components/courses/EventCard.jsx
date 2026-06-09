import { useState } from 'react'
import { Calendar, Clock, User, Users, CheckCircle, MapPin } from 'lucide-react'
import { Badge } from '../ui/index'
import Button from '../ui/Button'
import { formatDate } from '../../utils/formatDate'
import { formatModality } from '../../utils/formatModality'

// Usa tokens do design system — sem hex hardcoded
const CARD_GRADIENT = 'from-primary to-primary-light'

const EventCard = ({ course, onOpenModal }) => {
  const [isEnrolled, setIsEnrolled] = useState(course.isEnrolled ?? false)

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
          variant={isEnrolled ? "secondary" : "primary"}
          className={`w-full text-sm py-2.5 ${isEnrolled ? 'border-green-500/50 text-green-600' : ''}`}
          disabled={isFull && !isEnrolled}
        >
          {isEnrolled ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-green-500" /> Já estou inscrito
            </span>
          ) : (
            isFull ? 'Sem vagas' : 'Inscrever-se'
          )}
        </Button>
      </div>
    </div>
  )
}

export default EventCard