import api from './axios'

export const uploadFileAPI = (formData) =>
  api.post('/upload', formData)