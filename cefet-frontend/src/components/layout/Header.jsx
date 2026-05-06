import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Drawer from './Drawer'
import LogoSVG from '../../assets/cefetrj-logo'


const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { isAuthenticated } = useAuth()

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
            className="p-2 rounded-lg text-primary hover:bg-surface-hover transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={26} />
          </button>
        </div>
      </header>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export default Header
