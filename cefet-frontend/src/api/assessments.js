import api from './axios'

// Visão do gestor: config + avaliações + todas as notas
export const getAssessmentsAPI = (courseId) => api.get(`/courses/${courseId}/assessments`)

// Visão do aluno: suas avaliações e notas
export const getMyAssessmentsAPI = (courseId) => api.get(`/courses/${courseId}/assessments/my`)

// Configuração (método + média para aprovação)
export const updateGradingConfigAPI = (courseId, data) =>
  api.put(`/courses/${courseId}/assessments/config`, data)

// CRUD de avaliações
export const createAssessmentAPI = (courseId, data) =>
  api.post(`/courses/${courseId}/assessments`, data)
export const updateAssessmentAPI = (courseId, assessmentId, data) =>
  api.put(`/courses/${courseId}/assessments/${assessmentId}`, data)
export const deleteAssessmentAPI = (courseId, assessmentId) =>
  api.delete(`/courses/${courseId}/assessments/${assessmentId}`)

// Lançamento de notas em lote (+ publicar)
export const saveScoresAPI = (courseId, assessmentId, data) =>
  api.put(`/courses/${courseId}/assessments/${assessmentId}/scores`, data)
