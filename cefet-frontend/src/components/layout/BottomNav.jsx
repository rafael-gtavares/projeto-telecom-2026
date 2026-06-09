import { Link, useParams } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Settings, Home } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const items = [
  { tab: '../', label: 'Home', icon: Home },
  { tab: '', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'cursos', label: 'Cursos', icon: BookOpen },
  { tab: 'configuracoes', label: 'Config.', icon: Settings, adminOnly: true },
]

const BottomNav = () => {
  const { tab = '' } = useParams()
  const { role } = useAuth()
  const visible = items.filter(i => !i.adminOnly || role === 'admin')

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex">
      {visible.map(({ tab: t, label, icon: Icon }) => (
        <Link
          key={t}
          to={t ? `/admin/${t}` : '/admin'}
          className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-[11px] font-medium transition-colors ${
            tab === t ? 'text-primary' : 'text-text-muted'
          }`}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  )
}

export default BottomNav
