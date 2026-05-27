import api from './axios'

export const getActiveSchoolsAPI = () => api.get('/schools')
export const getAdminSchoolsAPI = () => api.get('/schools/admin')
export const createSchoolAPI = (data) => api.post('/schools', data)
export const updateSchoolAPI = (id, data) => api.put(`/schools/${id}`, data)
export const deleteSchoolAPI = (id) => api.delete(`/schools/${id}`)