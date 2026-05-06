import api from './axios'

export const getMeAPI = () => api.get('/users/me')
export const updateMeAPI = (data) => api.put('/users/me', data)
export const getUsersAPI = (params) => api.get('/users', { params })
export const updateUserRoleAPI = (id, role) => api.put(`/users/${id}/role`, { role })
export const getAdminStatsAPI = () => api.get('/admin/stats')
