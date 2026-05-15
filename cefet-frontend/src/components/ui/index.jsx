import { getInitials } from '../../utils/formatDate'

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-surface-hover text-primary',
    success: 'bg-success-light text-success-text',
    error: 'bg-error-light text-error-text',
    warning: 'bg-warning-light text-warning-text',
    gray: 'bg-gray-100 text-gray-500',
    blue: 'bg-surface-hover text-primary',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
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

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 border-b border-border pb-0 scrollbar-hide">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
          active === tab.value
            ? 'border-primary text-primary'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
)
