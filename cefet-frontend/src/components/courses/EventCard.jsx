import { Calendar, Clock, User, Users } from 'lucide-react'
import { Badge } from '../ui/index'
import Button from '../ui/Button'
import { formatDate } from '../../utils/formatDate'

const gradients = [
  'from-[#1565C0] to-[#1976D2]',
  'from-[#0D47A1] to-[#1565C0]',
  'from-[#1976D2] to-[#42A5F5]',
  'from-[#0D47A1] to-[#1976D2]',
]

const EventCard = ({ course, onEnroll, loading }) => {
  const slots = course.availableSlots ?? (course.maxSlots - course.enrolledCount)
  const isFull = slots <= 0
  const grad = gradients[parseInt(course._id?.slice(-1), 16) % gradients.length] || gradients[0]
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  return (
    <div className="card overflow-hidden flex flex-col hover:shadow-hover hover:border-border transition-all duration-200">
      <div className={`relative h-[160px] bg-gradient-to-br ${grad} flex flex-col items-center justify-center p-4`}>
        {course.imageUrl && (
          <>
            <img
              src={`${apiBase}${course.imageUrl}`}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Camada de escurecimento (Overlay) */}
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
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Calendar size={13} className="text-primary flex-shrink-0" />
            <span>{formatDate(course.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock size={13} className="text-primary flex-shrink-0" />
            <span>{course.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <User size={13} className="text-primary flex-shrink-0" />
            <span>{course.professor || 'A definir'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          {isFull
            ? <Badge variant="gray"><Users size={11} className="mr-1" />Vagas esgotadas</Badge>
            : <Badge variant="blue"><Users size={11} className="mr-1" />{slots} {slots === 1 ? 'vaga' : 'vagas'} restantes</Badge>
          }
        </div>
        <Button
          variant="primary"
          className="w-full text-sm py-2.5"
          disabled={isFull}
          loading={loading}
          onClick={() => onEnroll(course._id)}
        >
          {isFull ? 'Sem vagas' : 'Inscrever-se'}
        </Button>
      </div>
    </div>
  )
}

export default EventCard
