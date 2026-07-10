import { Link, useParams } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Settings, GraduationCap, LogOut, Users, School, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar, Badge } from '../ui/index'
import { getRoleLabel } from '../../utils/formatDate'
import { isAdmin } from '../../utils/permissions'
import LogoSVG from '../../assets/cefetrj-logo'

const navItems = [
  { tab: '', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'cursos', label: 'Cursos', icon: BookOpen },
  { tab: 'usuarios', label: 'Usuários', icon: Users, adminOnly: true },
  { tab: 'escolas', label: 'Escolas', icon: School, adminOnly: true },
]

const Sidebar = ({ onLogout }) => {
  const { tab = '' } = useParams()
  const { user, role } = useAuth()
  const items = navItems.filter(i => !i.adminOnly || isAdmin(role))

  return (
    <aside className="hidden md:flex w-[240px] flex-shrink-0 flex-col bg-white border-r border-border h-screen sticky top-0 overflow-y-auto">
      {/* Header com o Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
        </Link>
      </div>

      {/* Botão de Voltar Destacado */}
      <div className="px-3 py-2 border-b border-border bg-slate-50">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-primary rounded-md hover:bg-blue-50 transition-colors"
        >
          <ArrowLeft size={18} className="stroke-[2.5]" />
          <span>Voltar para o Início</span>
        </Link>
      </div>

      {/* Menu de Navegação Principal */}
      <nav className="flex-1 py-3">
        {items.map(({ tab: t, label, icon: Icon }) => (
          <Link
            key={t}
            to={t ? `/admin/${t}` : '/admin'}
            className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
              tab === t ? 'bg-surface-hover text-primary border-r-2 border-primary' : 'text-text-secondary hover:bg-surface-page hover:text-text-primary'
            }`}
          >
            <Icon size={18} /> {label}
          </Link>
        ))}
      </nav>

      {/* Perfil do Usuário e Logout */}
      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{user.name}</p>
              <Badge variant="blue" className="text-[10px]">{getRoleLabel(role)}</Badge>
            </div>
          </div>

          <button onClick={onLogout} className="btn-ghost w-full justify-center">
            <LogOut size={16} /> Sair da conta
          </button>
        </div>
      )}
    </aside>
  )
}

export default Sidebar