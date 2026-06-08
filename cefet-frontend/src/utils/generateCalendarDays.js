/**
 * Gera o array de dias para renderizar o calendário mensal.
 * Retorna células para o grid 7x5/6, incluindo células vazias no início.
 * @param {Date} calendarDate — qualquer data dentro do mês desejado
 * @param {Array} lessons — array de aulas com campo `date`
 */
export const generateCalendarDays = (calendarDate, lessons = []) => {
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()  // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []

  // Células vazias antes do primeiro dia
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, date: null, lessonCount: 0 })
  }

  // Dias do mês
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d).toDateString()
    const dayLessons = lessons.filter(l => {
      const lessonDate = new Date(l.date)

      return (
        lessonDate.getUTCFullYear() === year &&
        lessonDate.getUTCMonth() === month &&
        lessonDate.getUTCDate() === d
      )
    })
    cells.push({ day: d, date: new Date(year, month, d), lessonCount: dayLessons.length, lessons: dayLessons })
  }

  return cells
}
