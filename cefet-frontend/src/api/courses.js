import api from './axios'

export const getCoursesAPI = (params) => api.get('/courses', { params })
export const getCourseAPI = (id) => api.get(`/courses/${id}`)
export const createCourseAPI = (formData) =>
  api.post('/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateCourseAPI = (id, formData) =>
  api.put(`/courses/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteCourseAPI = (id) => api.delete(`/courses/${id}`)
export const enrollAPI = (courseId) => api.post('/enrollments', { courseId })
export const getMyEnrollmentsAPI = () => api.get('/enrollments/my')
