import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, FileText, Award, Megaphone, CheckCheck, BookOpen, CalendarClock, GraduationCap, MessageSquareText, UserCheck, UserX } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'

// Ícone por tipo de notificação
const typeIcon = {
  material: FileText,
  grade: Award,
  announcement: Megaphone,
  lesson: BookOpen,
  schedule: CalendarClock,
  certificate: GraduationCap,
  feedback: MessageSquareText,
  enrollment_approved: UserCheck,
  enrollment_rejected: UserX,
}

// Tempo relativo curto em pt-BR ("agora", "há 5 min", "há 2 h", "há 3 d")
const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  return `há ${d} d`
}

const NotificationBell = () => {
  const { items, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleOpenNotification = (n) => {
    setOpen(false)
    if (!n.read) markRead(n._id)
    const courseId = n.course?._id || n.course
    // `r` muda a cada clique (timestamp): garante que a URL mude mesmo que a
    // pessoa já esteja no curso/aba, disparando o recarregamento do conteúdo.
    if (courseId) navigate(`/meu-curso/${courseId}?tab=${n.tab}&r=${Date.now()}`)
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-text-primary hover:text-primary hover:bg-surface-hover transition-colors"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-error text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(90vw,360px)] max-h-[70vh] bg-white rounded-card shadow-modal border border-border z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-text-primary text-sm">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <CheckCheck size={14} /> Marcar todas
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Bell size={26} className="mx-auto text-text-muted opacity-40 mb-2" />
                <p className="text-sm text-text-muted">Nenhuma notificação por aqui.</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = typeIcon[n.type] || Bell
                return (
                  <button
                    key={n._id}
                    onClick={() => handleOpenNotification(n)}
                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors hover:bg-surface-hover ${
                      n.read ? '' : 'bg-surface-blue'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center flex-shrink-0 text-primary">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-semibold text-text-primary leading-tight flex-1">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                      {n.message && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[11px] text-text-muted mt-1">
                        {n.course?.title ? `${n.course.title} · ` : ''}{timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
