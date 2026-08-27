import { LayoutList, LayoutGrid } from 'lucide-react'
import { getInitials } from '../../utils/formatDate'

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-surface-hover text-primary',
    success: 'bg-success-light text-success-text',
    error: 'bg-error-light text-error-text',
    warning: 'bg-warning-light text-warning-text',
    gray: 'bg-surface-hover text-text-muted',
    blue: 'bg-surface-hover text-primary',
    purple: 'bg-[#F3E5F5] text-[#6A1B9A]',
  }

  return (
    <span className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export const Avatar = ({ name = '', size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl', xl: 'w-20 h-20 text-2xl' }
  return (
    <div className={`rounded-full bg-primary text-white font-semibold flex items-center justify-center flex-shrink-0 ${sizes[size]} ${className}`}>
      {getInitials(name)}
    </div>
  )
}

export const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return <div className={`${s} border-2 border-primary border-t-transparent rounded-full animate-spin`} />
}

// Alterna entre visualização em lista e em cards. Usado em Meus Cursos,
// AdminCourse (aba Aulas) e StudentCourse (aba Cronograma).
export const ViewToggle = ({ value, onChange }) => (
  <div className="flex items-center gap-1 flex-shrink-0 p-1 bg-surface-page rounded-lg border border-border">
    <button
      type="button"
      onClick={() => onChange('list')}
      title="Visualização em lista"
      aria-pressed={value === 'list'}
      className={`p-1.5 rounded-md transition-all ${value === 'list' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
    >
      <LayoutList size={16} />
    </button>
    <button
      type="button"
      onClick={() => onChange('grid')}
      title="Visualização em cards"
      aria-pressed={value === 'grid'}
      className={`p-1.5 rounded-md transition-all ${value === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}`}
    >
      <LayoutGrid size={16} />
    </button>
  </div>
)

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto scrollbar-hide">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap shrink-0 transition-all border-b-2 -mb-px ${active === tab.value
          ? 'border-primary text-primary'
          : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
)
