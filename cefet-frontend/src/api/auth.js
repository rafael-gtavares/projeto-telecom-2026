import api from './axios'

export const loginAPI = (email, password, rememberMe) =>
  api.post('/auth/login', { email, password, rememberMe })

export const registerAPI = (data) => api.post('/auth/register', data)

export const refreshTokenAPI = (refreshToken) =>
  api.post('/auth/refresh', { refreshToken })

export const verifyEmailAPI = (token) =>
  api.get(`/auth/verify-email?token=${token}`)

export const resendVerificationAPI = (email) =>
  api.post('/auth/resend-verification', { email })

export const forgotPasswordAPI = (email) =>
  api.post('/auth/forgot-password', { email })

export const validateResetTokenAPI = (token) =>
  api.get(`/auth/validate-reset-token?token=${token}`)

export const resetPasswordAPI = (token, password, confirmPassword) =>
  api.post(`/auth/reset-password?token=${token}`, { password, confirmPassword })
