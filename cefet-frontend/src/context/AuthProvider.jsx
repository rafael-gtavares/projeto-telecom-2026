import { useState, useEffect } from 'react'
import { AuthContext } from './AuthContext'
import { loginAPI } from '../api/auth'
import { getMeAPI } from '../api/users'
import { getAccessToken, setTokens, clearTokens } from '../utils/tokenStorage'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      const token = getAccessToken()
      if (token) {
        try {
          const { data } = await getMeAPI()
          setUser(data.data)
        } catch {
          clearTokens()
        }
      }
      setLoading(false)
    }
    restore()
  }, [])

  // Sincroniza a sessão entre abas: logout numa aba desloga as outras;
  // login numa aba autentica as demais (igual às grandes redes sociais).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'accessToken') return
      if (!e.newValue) {
        setUser(null) // deslogou em outra aba
      } else {
        getMeAPI().then(({ data }) => setUser(data.data)).catch(() => {})
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = async (email, password, rememberMe = false) => {
    const { data } = await loginAPI(email, password, rememberMe)
    setTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    })
    setUser(data.data.user)
    return data.data.user
  }

  const logout = () => {
    clearTokens()
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
