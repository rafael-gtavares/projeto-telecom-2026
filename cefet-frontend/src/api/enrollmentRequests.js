import api from './axios'

// Aluno solicita entrada no curso
export const requestEnrollmentAPI = (courseId) =>
  api.post(`/courses/${courseId}/enrollment-requests`)

// Aluno lista as próprias solicitações (todas, ou filtradas por status)
export const getMyEnrollmentRequestsAPI = (status) =>
  api.get('/enrollment-requests/my', { params: status ? { status } : {} })

// Professor/admin lista solicitações do curso (suporta filtro por status)
export const getCourseEnrollmentRequestsAPI = (courseId, status) =>
  api.get(`/courses/${courseId}/enrollment-requests`, { params: status ? { status } : {} })

// Professor/admin aprova solicitação → efetiva a matrícula
export const approveEnrollmentRequestAPI = (courseId, requestId) =>
  api.patch(`/courses/${courseId}/enrollment-requests/${requestId}/approve`)

// Professor/admin rejeita solicitação
export const rejectEnrollmentRequestAPI = (courseId, requestId, reason) =>
  api.patch(`/courses/${courseId}/enrollment-requests/${requestId}/reject`, { reason })

// Aluno cancela a própria solicitação (só se ainda pendente)
export const cancelEnrollmentRequestAPI = (requestId) =>
  api.delete(`/enrollment-requests/${requestId}`)