import api from './axios'

// Gestão do formulário (gestor do curso)
export const getFeedbackFormAPI = (courseId) => api.get(`/courses/${courseId}/feedback/form`)
export const saveFeedbackFormAPI = (courseId, data) => api.put(`/courses/${courseId}/feedback/form`, data)
export const getFeedbackResultsAPI = (courseId) => api.get(`/courses/${courseId}/feedback/results`)

// Aluno
export const getStudentFeedbackAPI = (courseId) => api.get(`/courses/${courseId}/feedback`)
export const submitFeedbackResponseAPI = (courseId, answers) =>
  api.post(`/courses/${courseId}/feedback/response`, { answers })
export const updateFeedbackResponseAPI = (courseId, answers) =>
  api.put(`/courses/${courseId}/feedback/response`, { answers })
