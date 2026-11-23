import api from './axios'

// ─── Gestor do curso ──────────────────────────────────────────────────────────

// Cursos que o usuário gerencia e têm gente na fila de espera (origem dos convites)
export const getWaitlistSourcesAPI = (excludeId) =>
  api.get('/courses/waitlist-sources', { params: excludeId ? { excludeId } : {} })

// Fila de espera do curso de origem, marcando quem pode ser convidado.
// `target`: id do curso sendo editado; `prerequisites`: ids (curso ainda não criado)
export const getCourseWaitlistAPI = (sourceId, { target, prerequisites } = {}) => {
  const params = {}
  if (target) params.target = target
  else if (prerequisites?.length) params.prerequisites = prerequisites.join(',')
  return api.get(`/courses/${sourceId}/waitlist`, { params })
}

export const getCourseInvitationsAPI = (courseId) =>
  api.get(`/courses/${courseId}/invitations`)

export const cancelCourseInvitationAPI = (courseId, invitationId) =>
  api.delete(`/courses/${courseId}/invitations/${invitationId}`)

// ─── Aluno ────────────────────────────────────────────────────────────────────

export const getMyInvitationsAPI = () => api.get('/invitations/my')
export const acceptInvitationAPI = (id) => api.post(`/invitations/${id}/accept`)
export const declineInvitationAPI = (id) => api.post(`/invitations/${id}/decline`)
