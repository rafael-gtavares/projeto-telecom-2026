import api from './axios'

export const loginAPI = (email, password, rememberMe) =>
  api.post('/auth/login', { email, password, rememberMe })

export const registerAPI = (data) => api.post('/auth/register', data)

export const refreshTokenAPI = (refreshToken) =>
  api.post('/auth/refresh', { refreshToken })

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })
export const resetPassword = (token, password) => api.post(`/auth/reset-password/${token}`, { password })
