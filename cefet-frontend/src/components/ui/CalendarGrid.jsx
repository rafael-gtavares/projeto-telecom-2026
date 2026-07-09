import { ChevronLeft, ChevronRight } from 'lucide-react'
import { generateCalendarDays } from '../../utils/generateCalendarDays'

const CalendarGrid = ({
  calendarDate,
  selectedDay,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  getDayMetadata, // Recebendo a função de metadados do componente pai
}) => {
  // Mapeamento mantendo suas classes personalizadas ou fallback para o padrão Tailwind sugerido
  const indicatorColors = {
    primary: 'bg-primary bg-blue-500',
    success: 'bg-success bg-green-500',
    warning: 'bg-warning bg-amber-500',
    error: 'bg-error bg-red-500',
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-page">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="font-semibold text-text-primary capitalize text-sm">
          {calendarDate.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}
        </span>

        <button
          onClick={onNextMonth}
          className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {generateCalendarDays(calendarDate).map(({ day, date }, idx) => {
          // Buscando os metadados reais gerados pelo normalize do pai
          const metadata = day && date ? getDayMetadata(date) : { indicators: [] }
          const indicators = metadata.indicators || []
          
          // O dia passa a ser clicável se tiver qualquer tipo de evento (aula, início, fim, etc.)
          const hasEvents = indicators.length > 0

          const today = day && date?.toDateString() === new Date().toDateString()
          const isSelected = day && selectedDay?.toDateString() === date?.toDateString()

          return (
            <div
              key={idx}
              onClick={() =>
                day &&
                hasEvents &&
                onSelectDay(isSelected ? null : date)
              }
              className={`
                flex flex-col items-center justify-start 
                py-1.5 rounded-xl text-sm transition-all select-none
                ${!day ? '' : hasEvents ? 'cursor-pointer' : 'cursor-default'}
                ${isSelected 
                  ? 'bg-primary' 
                  : today 
                    ? 'bg-surface-blue text-primary' 
                    : hasEvents 
                      ? 'hover:bg-surface-hover' 
                      : ''
                }
              `}
            >
              <span
                className={`
                  font-semibold leading-none text-sm
                  ${isSelected ? 'text-white' : today ? 'text-primary' : 'text-text-primary'}
                  ${!day ? 'invisible' : ''}
                `}
              >
                {day || '0'}
              </span>

              {/* Renderização dinâmica dos indicadores baseada no array retornado pelo getDayMetadata */}
              {day && hasEvents && (
                <div className="flex gap-0.5 mt-1 items-center justify-center min-h-[4px]">
                  {indicators.map((indicator, i) => (
                    <span
                      key={i}
                      className={`
                        w-1 h-1 rounded-full transition-colors
                        ${isSelected ? 'bg-white' : indicatorColors[indicator.type] || indicatorColors[indicator.color]}
                      `}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid