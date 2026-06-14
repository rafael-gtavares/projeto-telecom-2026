import axios from 'axios'
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from '../utils/tokenStorage'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Renovação "single-flight": requisições concorrentes que recebem 401 ao mesmo
// tempo compartilham UMA única chamada de refresh (evita tempestade de refresh).
let refreshPromise = null

const doRefresh = async () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('no refresh token')
  const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
  setAccessToken(data.data.accessToken)
  return data.data.accessToken
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = doRefresh().finally(() => { refreshPromise = null })
        }
        const newToken = await refreshPromise
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api
