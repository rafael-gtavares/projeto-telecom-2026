import api from "./axios"

export const enrollAPI = (courseId) =>
  api.post('/enrollments', { courseId })

export const getMyEnrollmentsAPI = () =>
  api.get('/enrollments/my')

export const checkEnrollmentAPI = (courseId) =>
  api.get(`/enrollments/check/${courseId}`)

export const cancelEnrollmentAPI = (courseId) =>
  api.delete(`/enrollments/${courseId}`)