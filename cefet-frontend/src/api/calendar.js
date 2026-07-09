import api from './axios'

// Agenda pública: aulas de todos os cursos publicados (+ meus, se logado)
export const getCalendarAPI = () => api.get('/courses/calendar')

// Choques de horário entre um curso e a agenda atual do aluno logado
export const getCourseConflictsAPI = (courseId) => api.get(`/enrollments/conflicts/${courseId}`)
