import api from './axios'

export const getCoursesAPI = (params) =>
  api.get('/courses', { params })

export const getAllCoursesAPI = (params) =>
  api.get('/courses/all', { params })

export const getCourseStatsAPI = (courseId) =>
  api.get(`/courses/${courseId}/stats`)

export const getCourseAPI = (id) =>
  api.get(`/courses/${id}`)

export const createCourseAPI = (data) =>
  api.post('/courses', data)

export const updateCourseAPI = (id, data) =>
  api.put(`/courses/${id}`, data)

export const deleteCourseAPI = (id) =>
  api.delete(`/courses/${id}`)

export const enrollAPI = (courseId) =>
  api.post('/enrollments', { courseId })

export const getMyEnrollmentsAPI = () =>
  api.get('/enrollments/my')

export const checkEnrollmentAPI = (courseId) =>
  api.get(`/enrollments/check/${courseId}`)

export const cancelEnrollmentAPI = (courseId) =>
  api.delete(`/enrollments/${courseId}`)