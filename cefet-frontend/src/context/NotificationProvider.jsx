import { useState, useEffect, useCallback, useRef } from 'react'
import { NotificationContext } from './NotificationContext'
import { useAuth } from './AuthContext'
import {
  getNotificationsAPI,
  markNotificationReadAPI,
  markAllNotificationsReadAPI,
} from '../api/notifications'

// Intervalo do polling — "tempo real" o suficiente sem manter conexão aberta.
const POLL_INTERVAL = 15000
// Título original da aba (definido no index.html); o contador é prefixado a ele.
const BASE_TITLE = typeof document !== 'undefined' ? document.title : ''

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await getNotificationsAPI()
      setItems(data.data.items)
      setUnreadCount(data.data.unreadCount)
    } catch {
      // silencioso: polling em background não deve poluir a tela com erros
    }
  }, [])

  // Liga/desliga o polling conforme o login. Ao deslogar, zera tudo.
  useEffect(() => {
    if (!isAuthenticated) {
      setItems([])
      setUnreadCount(0)
      return
    }

    setLoading(true)
    fetchNotifications().finally(() => setLoading(false))

    timerRef.current = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [isAuthenticated, fetchNotifications])

  // Volta a checar assim que o usuário retorna à aba (atualização mais ágil)
  useEffect(() => {
    if (!isAuthenticated) return
    const onFocus = () => fetchNotifications()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [isAuthenticated, fetchNotifications])

  // Reflete o contador no título da aba: "(2) CEFET/RJ"
  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE
  }, [unreadCount])

  // Marca uma como lida (otimista) e sincroniza com o back
  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n._id === id && !n.read ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await markNotificationReadAPI(id)
    } catch {
      fetchNotifications() // reverte para o estado real em caso de erro
    }
  }, [fetchNotifications])

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await markAllNotificationsReadAPI()
    } catch {
      fetchNotifications()
    }
  }, [fetchNotifications])

  return (
    <NotificationContext.Provider
      value={{ items, unreadCount, loading, markRead, markAllRead, refresh: fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
