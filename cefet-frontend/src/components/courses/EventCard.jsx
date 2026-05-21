import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Users, CheckCircle, MapPin } from 'lucide-react'
import { Badge } from '../ui/index'
import Button from '../ui/Button'
import { formatDate } from '../../utils/formatDate'
import { useAuth } from '../../context/AuthContext'
import { checkEnrollmentAPI } from '../../api/courses'

const gradients = [
  'from-[#1565C0] to-[#1976D2]',
  'from-[#0D47A1] to-[#1565C0]',
  'from-[#1976D2] to-[#42A5F5]',
  'from-[#0D47A1] to-[#1976D2]',
]

const EventCard = ({ course, onOpenModal }) => {
  const { isAuthenticated } = useAuth()
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (course.isEnrolled !== undefined) {
      setIsEnrolled(course.isEnrolled);
    }

    if (!course?._id || !isAuthenticated) {
      setIsEnrolled(false)
      return
    }

    const checkStatus = async () => {
      try {
        setChecking(true)
        const { data } = await checkEnrollmentAPI(course._id)
        setIsEnrolled(data.data.enrolled)
      } catch (error) {
        setIsEnrolled(false)
      } finally {
        setChecking(false)
      }
    }

    if (course.isEnrolled === undefined) {
      checkStatus()
    }
  }, [course._id, course.isEnrolled, isAuthenticated])

  const slots = course.availableSlots ?? (course.maxSlots - course.enrolledCount)
  const isFull = slots <= 0

  //Se quiser cores de fundos diferentes e aleatórias para cada curso (caso não tenha dado upload numa foto)
  // const grad = gradients[parseInt(course._id?.slice(-1), 16) % gradients.length] || gradients[0]

  //Se quiser uma única cor
  const grad = gradients[0]

  // Lógica para exibição de data simplificada
  const isOneDay = course.startDate?.slice(0, 10) === course.endDate?.slice(0, 10)

  // Resumo dos dias (ex: "Seg, Qua, Sex" ou "Sábado")
  const scheduleSummary = course.schedule?.length > 1
    ? `${course.schedule.length} dias na semana`
    : course.schedule?.[0]
      ? `${course.schedule[0].dayOfWeek}, ${course.schedule[0].startTime}`
      : 'Horário a definir'

  // Local principal (primeira sala encontrada)
  const mainLocation = course.schedule?.[0]?.location || 'A definir'

  return (
    <div
      className="card overflow-hidden flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 ease"
      onClick={() => onOpenModal(course)}
    >
      <div className={`relative h-[160px] bg-gradient-to-br ${grad} flex flex-col items-center justify-center p-4`}>
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
            <span className="truncate">{scheduleSummary}</span>
          </div>

          {/* Localização (Nova!) */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <MapPin size={13} className="text-primary flex-shrink-0" />
            <span className="truncate">{mainLocation}</span>
          </div>

          {/* Professor */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <User size={13} className="text-primary flex-shrink-0" />
            <span className="truncate">{course.professor || 'A definir'}</span>
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
          disabled={(isFull && !isEnrolled) || checking}
          loading={checking}
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