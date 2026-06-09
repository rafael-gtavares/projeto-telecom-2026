import { createContext, useContext, useState, useEffect } from 'react'
import { loginAPI } from '../api/auth'
import { getMeAPI } from '../api/users'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const { data } = await getMeAPI()
          setUser(data.data)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      }
      setLoading(false)
    }
    restore()
  }, [])

  const login = async (email, password, rememberMe = false) => {
    const { data } = await loginAPI(email, password, rememberMe)
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    setUser(data.data.user)
    return data.data.user
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  const updateUser = (updated) => setUser((prev) => ({ ...prev, ...updated }))

  const isAuthenticated = !!user
  const role = user?.role || null

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, role, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
