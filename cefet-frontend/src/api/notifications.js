import api from './axios'

// Lista as notificações do usuário + contador de não lidas ({ items, unreadCount })
export const getNotificationsAPI = () => api.get('/notifications')
export const markNotificationReadAPI = (id) => api.patch(`/notifications/${id}/read`)
export const markAllNotificationsReadAPI = () => api.patch('/notifications/read-all')
