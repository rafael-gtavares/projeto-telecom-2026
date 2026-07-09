import { Clock, MapPin, Video, AlertTriangle, CalendarDays } from 'lucide-react'

const CourseScheduleCard = ({ event }) => {
  // Ajustando a desestruturação de acordo com o objeto normalizado pelo CalendarLessons
  const {
    type,
    course,
    title,
    startTime,
    endTime,
    modality,
    location,
    meetingUrl,
    conflict = false,
  } = event

  // ==========================================
  // CARD: INÍCIO DO CURSO
  // ==========================================
  if (type === 'start') {
    return (
      <div className="border border-success/30 bg-success/5 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-success/10 rounded-lg text-success">
          <CalendarDays size={18} className="text-green-500" />
        </div>
        <div>
          <span className="text-xs font-bold text-green-600 uppercase tracking-wider">🚀 Início do curso</span>
          <h4 className="font-semibold text-text-primary text-sm mt-0.5">
            {course}
          </h4>
        </div>
      </div>
    )
  }

  // ==========================================
  // CARD: TÉRMINO DO CURSO
  // ==========================================
  if (type === 'end') {
    return (
      <div className="border border-warning/30 bg-warning/5 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-warning/10 rounded-lg text-warning">
          <CalendarDays size={18} className="text-amber-500" />
        </div>
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">🏁 Término do curso</span>
          <h4 className="font-semibold text-text-primary text-sm mt-0.5">
            {course}
          </h4>
        </div>
      </div>
    )
  }

  // ==========================================
  // CARD: AULA REGULAR (Com ou Sem Conflito)
  // ==========================================
  return (
    <div className={`border rounded-xl p-4 space-y-3 transition-all ${
      conflict 
        ? 'border-error/50 bg-error/5 ring-1 ring-error/20' 
        : 'border-border'
    }`}>
      {/* Cabeçalho */}
      <div className="flex justify-between gap-3">
        <div>
          <h4 className="font-semibold text-text-primary">
            {course || 'Curso'}
          </h4>
          {title && (
            <p className="text-sm text-text-secondary mt-0.5">
              {title}
            </p>
          )}
        </div>

        {conflict && (
          <AlertTriangle
            size={18}
            className="text-error shrink-0 animate-pulse text-red-500"
          />
        )}
      </div>

      {/* Horário */}
      {(startTime || endTime) && (
        <div className="flex items-center gap-2 text-sm text-text-primary">
          <Clock size={15}/>
          <span>{startTime} - {endTime}</span>
        </div>
      )}

      {/* Modalidade, Local ou Link */}
      {modality && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          {modality.toLowerCase() === 'online' ? <Video size={15}/> : <MapPin size={15}/>}
          <span className="capitalize">{modality}</span>
        </div>
      )}

      {modality?.toLowerCase() !== 'online' && location && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <MapPin size={15}/>
          <span>{location}</span>
        </div>
      )}

      {modality?.toLowerCase() === 'online' && meetingUrl && (
        <a
          href={meetingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary font-medium hover:underline block"
        >
          Entrar na aula ao vivo
        </a>
      )}

      {/* Alerta Visual de Conflito Extra */}
      {conflict && (
        <div className="flex items-center gap-2 text-xs font-bold text-error border-t border-error/20 pt-2 mt-2">
          <AlertTriangle size={14} className="text-red-500"/>
          <span>⚠️ Atenção: Conflito de horário detectado!</span>
        </div>
      )}
    </div>
  )
}

export default CourseScheduleCard