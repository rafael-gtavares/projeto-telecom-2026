import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Home, Menu, UserCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Drawer from './Drawer'
import LogoSVG from '../../assets/cefetrj-logo'
import Button from '../ui/Button'
import { LogOut } from 'lucide-react'
import { getRoleLabel } from '../../utils/formatDate'



const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { isAuthenticated, user, role, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }


  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border h-[60px] md:h-[72px]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight">
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
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link to="/">Início</Link>
                <Link to="/meus-cursos">Meus Cursos</Link>
                <Link to="/meu-perfil">Meu Perfil</Link>
                {(role === 'admin' || role === 'professor') && (
                <Link to="/admin">
                  Painel {getRoleLabel(role)}
                </Link>
              )}
              </>
            ) : (
              <>
                <a href="#cursos" className="text-text-primary hover:text-primary transition-colors text-sm">Cursos e Eventos</a>
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
