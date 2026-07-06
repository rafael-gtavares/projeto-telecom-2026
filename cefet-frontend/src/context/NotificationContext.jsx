import { createContext, useContext } from 'react'

// Só o contexto e o hook ficam aqui (padrão do AuthContext), para o Fast Refresh
// do Vite funcionar nos componentes que consomem useNotifications.
export const NotificationContext = createContext(null)

export const useNotifications = () => useContext(NotificationContext)
