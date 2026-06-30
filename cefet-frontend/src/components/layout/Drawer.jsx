import { Link, NavLink as RouterNavLink, useNavigate } from 'react-router-dom'
import { X, GraduationCap, BookOpen, UserCircle, LogOut, ShieldCheck, LayoutDashboard, Users, Home } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar, Badge } from '../ui/index'
import Button from '../ui/Button'
import { getRoleLabel } from '../../utils/formatDate'
import { canAccessAdminPanel, isAdmin } from '../../utils/permissions'
import LogoSVG from '../../assets/cefetrj-logo'

// Item do menu com destaque da página ativa (barra lateral + fundo + cor primária)
const NavLink = ({ to, icon: Icon, children, onClick, end }) => (
  <RouterNavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-5 py-3.5 border-l-[3px] transition-colors text-[15px] ${
        isActive
          ? 'border-primary bg-surface-hover text-primary font-semibold'
          : 'border-transparent text-text-primary hover:bg-surface-hover hover:text-primary'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={18} className={isActive ? 'text-primary' : 'text-text-muted'} />
        {children}
      </>
    )}
  </RouterNavLink>
)

const Drawer = ({ open, onClose }) => {
  const { isAuthenticated, user, role, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); onClose(); navigate('/') }
  const close = () => onClose()

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-[280px] bg-white z-50 shadow-modal flex flex-col transition-transform duration-250 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Link to="/" onClick={close} className="flex items-center gap-2 text-primary font-bold text-xl">
            <LogoSVG color="#1565C0" size={22} /> CEFET/RJ
          </Link>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-page text-text-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-text-primary truncate">{user.name}</p>
              <Badge variant="blue">{getRoleLabel(role)}</Badge>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2">
          <NavLink to="/" icon={Home} onClick={close} end>Início</NavLink>
          {!isAuthenticated && (
            <>
              <a href="#cursos" onClick={close} className="flex items-center gap-3 px-5 py-3.5 text-text-primary hover:bg-surface-hover transition-colors text-[15px]">
                <BookOpen size={18} className="text-text-muted" /> Cursos & Eventos
              </a>
            </>
          )}
          {isAuthenticated && (
            <>
              <NavLink to="/meus-cursos" icon={BookOpen} onClick={close}>Meus Cursos</NavLink>
              <NavLink to="/meu-perfil" icon={UserCircle} onClick={close}>Meu Perfil</NavLink>
              {canAccessAdminPanel(role) && (
                <NavLink to="/admin" icon={isAdmin(role) ? ShieldCheck : LayoutDashboard} onClick={close}>
                  Painel {getRoleLabel(role)}
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border space-y-">
          {isAuthenticated ? (
            <button onClick={handleLogout} className="btn-ghost w-full justify-center">
              <LogOut size={16} /> Sair da conta
            </button>
          ) : (
            <>
              <Link to="/login" onClick={close}><Button variant="primary" className="w-full">Entrar</Button></Link>
              <Link to="/cadastro" onClick={close}><Button variant="secondary" className="w-full mt-2">Cadastrar-se</Button></Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Drawer
