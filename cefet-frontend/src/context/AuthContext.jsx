import { createContext, useContext } from 'react'

// Apenas o contexto e o hook ficam aqui (sem componente), para o Fast Refresh
// do Vite funcionar nos arquivos que consomem useAuth. O provider fica em
// AuthProvider.jsx (arquivo que exporta só o componente).
export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)
