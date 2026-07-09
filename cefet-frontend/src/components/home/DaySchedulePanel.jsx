import CourseScheduleCard from '../ui/CourseScheduleCard'

const DaySchedulePanel = ({ selectedDay, events = [] }) => {
  if (!selectedDay) {
    return (
      <div className="card p-5 text-center">
        <p className="text-sm text-text-secondary">
          Selecione um dia no calendário para visualizar as aulas.
        </p>
      </div>
    )
  }

  // Ordenação inteligente opcional: coloca "Início" e "Fim" no topo, e ordena as "Aulas" por horário
  const sortedEvents = [...events].sort((a, b) => {
    if (a.type !== 'lesson') return -1
    if (b.type !== 'lesson') return 1
    return (a.startTime || '').localeCompare(b.startTime || '')
  })

  return (
    <div className="card p-5 space-y-5">
      {/* Cabeçalho */}
      <div>
        <h3 className="font-semibold text-text-primary capitalize">
          {selectedDay.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          {sortedEvents.length === 0
            ? 'Nenhum evento neste dia'
            : `${sortedEvents.length} evento${sortedEvents.length > 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Sem eventos */}
      {sortedEvents.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-text-secondary">
            Não existem aulas ou eventos agendados para este dia.
          </p>
        </div>
      )}

      {/* Lista de Eventos Diversos */}
      {sortedEvents.length > 0 && (
        <div className="space-y-3">
          {sortedEvents.map((event) => (
            <CourseScheduleCard
              key={event.id} // Usando o id único gerado no normalizer do pai
              event={event}   // Injetando o evento completo estruturado
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DaySchedulePanel