import { useMemo, useState } from 'react'
import CalendarGrid from '../ui/CalendarGrid'
import DaySchedulePanel from './DaySchedulePanel'
import { parseUTCDate } from '../../utils/formatDate'

const CalendarLessons = ({ lessons = [] }) => {
    const [calendarDate, setCalendarDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState(null)

    // 1. Centraliza, normaliza e deriva TODOS os tipos de eventos (Início, Fim, Aulas) + Conflitos
    const allNormalizedEvents = useMemo(() => {
        let events = []

        lessons.forEach((courseItem) => {
            // Gerar evento de Início do Curso (se houver a propriedade)
            if (courseItem.startDate) {
                events.push({
                    id: `start-${courseItem.id || courseItem.course}`,
                    type: 'start',
                    course: courseItem.course,
                    date: parseUTCDate(courseItem.startDate)
                })
            }

            // Gerar evento de Término do Curso (se houver a propriedade)
            if (courseItem.endDate) {
                events.push({
                    id: `end-${courseItem.id || courseItem.course}`,
                    type: 'end',
                    course: courseItem.course,
                    date: parseUTCDate(courseItem.endDate)
                })
            }

            // Mapear as Aulas Normais deste curso
            if (courseItem.classes) {
                courseItem.classes.forEach((cls) => {
                    events.push({
                        id: `lesson-${cls.id || Math.random()}`,
                        type: 'lesson',
                        course: courseItem.course,
                        title: cls.title,
                        date: parseUTCDate(cls.date),
                        startTime: cls.startTime, // Ex: "18:00"
                        endTime: cls.endTime,     // Ex: "20:00"
                        modality: cls.modality,   // 'Presencial' ou 'Online'
                        location: cls.location,
                        meetingUrl: cls.meetingUrl
                    })
                })
            }
        })

        // 2. Detecção de conflitos de horário entre as aulas normais
        return events.map((event, _, self) => {
            if (event.type !== 'lesson') return event

            const hasConflict = self.some((other) => {
                if (other.id === event.id || other.type !== 'lesson') return false
                
                // Mesma data?
                const isSameDay = other.date.toDateString() === event.date.toDateString()
                if (!isSameDay) return false

                // Choque de horários: (StartA < EndB) && (EndA > StartB)
                return event.startTime < other.endTime && event.endTime > other.startTime
            })

            return hasConflict ? { ...event, conflict: true } : event
        })
    }, [lessons])

    // Eventos do dia selecionado (Envia para o painel inferior)
    const selectedDayEvents = useMemo(() => {
        if (!selectedDay) return []

        return allNormalizedEvents.filter((event) => {
            return event.date.toDateString() === selectedDay.toDateString()
        })
    }, [selectedDay, allNormalizedEvents])

    // Metadata do calendário: Analisa o dia e devolve os indicadores corretos
    const getDayMetadata = (date) => {
        if (!date) return { indicators: [] }

        const dayEvents = allNormalizedEvents.filter(
            (event) => event.date.toDateString() === date.toDateString()
        )

        const hasStart = dayEvents.some((e) => e.type === 'start')
        const hasEnd = dayEvents.some((e) => e.type === 'end')
        const hasConflict = dayEvents.some((e) => e.conflict)
        const hasLessons = dayEvents.some((e) => e.type === 'lesson')

        // Monta a lista de bolinhas coloridas que o Grid vai desenhar
        const indicators = []
        if (hasStart) indicators.push({ type: 'start', color: 'success' }) // Verde
        if (hasLessons && !hasConflict) indicators.push({ type: 'lesson', color: 'primary' }) // Azul
        if (hasEnd) indicators.push({ type: 'end', color: 'warning' }) // Amarelo
        if (hasConflict) indicators.push({ type: 'conflict', color: 'error' }) // Vermelho

        return {
            hasLessons,
            hasStart,
            hasEnd,
            hasConflict,
            indicators
        }
    }

    const handlePrevMonth = () => {
        setCalendarDate(prev => {
            const date = new Date(prev)
            date.setMonth(date.getMonth() - 1)
            return date
        })
    }

    const handleNextMonth = () => {
        setCalendarDate(prev => {
            const date = new Date(prev)
            date.setMonth(date.getMonth() + 1)
            return date
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 bg-white p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"/> Início do Curso</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"/> Aula Regular</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"/> Término do Curso</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"/> Conflito de Horário</div>
            </div>

            <CalendarGrid
                calendarDate={calendarDate}
                selectedDay={selectedDay}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onSelectDay={setSelectedDay}
                getDayMetadata={getDayMetadata} 
            />

            <DaySchedulePanel
                selectedDay={selectedDay}
                events={selectedDayEvents} 
            />
        </div>
    )
}

export default CalendarLessons