import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasMinimumRole } from '../utils/permissions'

// `minRole`: exige que o usuário tenha PELO MENOS esse nível (hierarquia) —
// usado para a maioria das rotas protegidas por cargo, já que admins/superadmins
// automaticamente herdam o acesso de cargos abaixo.
// `roles`: lista fechada de cargos aceitos, para os raros casos em que a
// hierarquia não deve se aplicar (mantido por compatibilidade).
const PrivateRoute = ({ children, roles, minRole }) => {
  const { isAuthenticated, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (minRole && !hasMinimumRole(role, minRole)) return <Navigate to="/" replace />
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />

  return children
}

export default PrivateRoute
