import { AlertCircle } from 'lucide-react'

const Input = ({ label, error, icon: Icon, rightElement, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>}
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />}
      <input
        className={`input-field ${Icon ? 'pl-10' : ''} ${rightElement ? 'pr-10' : ''} ${error ? 'border-error focus:border-error focus:shadow-none' : ''} ${className}`}
        {...props}
      />
      {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
    </div>
    {error && (
      <p className="flex items-center gap-1 text-xs text-error mt-1.5">
        <AlertCircle size={12} /> {error}
      </p>
    )}
  </div>
)

export default Input
