import api from './axios'

// Avisos de um curso (aluno vê os da turma + os individuais dele; gestor vê todos)
export const getAnnouncementsAPI = (courseId) => api.get(`/courses/${courseId}/announcements`)
export const createAnnouncementAPI = (courseId, data) => api.post(`/courses/${courseId}/announcements`, data)
export const deleteAnnouncementAPI = (courseId, announcementId) =>
  api.delete(`/courses/${courseId}/announcements/${announcementId}`)
