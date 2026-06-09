import { Loader2 } from 'lucide-react'

const Button = ({ children, variant = 'primary', loading, className = '', ...props }) => {
  const base = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  }[variant]

  return (
    <button className={`${base} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

export default Button
