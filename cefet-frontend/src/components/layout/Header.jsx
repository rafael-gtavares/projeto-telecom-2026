import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, Home, Menu, UserCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Drawer from './Drawer'
import LogoSVG from '../../assets/cefetrj-logo'
import Button from '../ui/Button'
import { LogOut } from 'lucide-react'
import { getRoleLabel } from '../../utils/formatDate'
import { canAccessAdminPanel } from '../../utils/permissions'

// Item de navegação com indicador da página ativa (sublinhado animado em cor primária)
const navItemClass = ({ isActive }) =>
  `relative text-base font-medium transition-colors py-1 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-primary after:transition-all after:duration-200 ${
    isActive
      ? 'text-primary after:w-full'
      : 'text-text-primary hover:text-primary after:w-0 hover:after:w-full'
  }`

const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { isAuthenticated, user, role, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }


  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border h-[60px] md:h-[72px]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <Link
            to="/"
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0 });
              }
            }}
            className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight"
          >
            <LogoSVG />
            CEFET/RJ
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-primary hover:bg-surface-hover transition-colors md:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={26} />
          </button>
          <nav className="hidden md:flex items-center gap-7">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/"
                  end
                  className={navItemClass}
                  onClick={(e) => {
                    if (window.location.pathname === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0 });
                    }
                  }}
                >Início</NavLink>
                <NavLink to="/meus-cursos" className={navItemClass}>Meus Cursos</NavLink>
                <NavLink to="/meu-perfil" className={navItemClass}>Meu Perfil</NavLink>
                {canAccessAdminPanel(role) && (
                  <NavLink to="/admin" className={navItemClass}>
                    Painel {getRoleLabel(role)}
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <a href="#cursos" className="relative text-base font-medium text-text-primary hover:text-primary transition-colors py-1 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-200 hover:after:w-full">Cursos e Eventos</a>
              </>
            )}
          </nav>
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="btn-ghost w-full justify-center">
                <LogOut size={16} /> Sair da conta
              </button>
            ) : (
              <>
                <Link to="/login"><Button variant="primary" className="w-full">Entrar</Button></Link>
                <Link to="/cadastro"><Button variant="secondary" className="w-full">Cadastrar-se</Button></Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export default Header
