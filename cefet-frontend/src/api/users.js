import api from './axios'

export const getMeAPI = () => api.get('/users/me')
export const updateMeAPI = (data) => api.put('/users/me', data)
export const getUsersAPI = (params) => api.get('/users', { params })
export const getUsersBaseAPI = (params) => api.get('/users/base')
export const updateUserRoleAPI = (id, role) => api.put(`/users/${id}/role`, { role })
export const updateEditPermissionAPI = (id, canEditPersonalInfo) => api.put(`/users/${id}/editPermission`, canEditPersonalInfo)
export const getAdminStatsAPI = (period) => api.get(`/admin/stats?period=${period}`)

// Escolas
export const getSchoolsAPI = () => api.get('/schools')
export const getAllSchoolsAPI = () => api.get('/schools/all')
export const createSchoolAPI = (data) => api.post('/schools', data)
export const updateSchoolAPI = (id, data) => api.put(`/schools/${id}`, data)
export const deleteSchoolAPI = (id) => api.delete(`/schools/${id}`)

