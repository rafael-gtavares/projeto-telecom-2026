import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'

const Toast = ({ message, show, onClose, action }) => {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 3500)
      return () => clearTimeout(t)
    }
  }, [show, onClose])

  if (!show) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toastIn">
      <div className="flex items-center gap-3 bg-[#1A1A2E] text-white px-5 py-3 rounded-xl shadow-modal text-sm">
        <span>{message}</span>
        {action && <Link to={action.href} className="text-primary-lighter font-semibold hover:underline">{action.label}</Link>}
        <button onClick={onClose} className="ml-2 text-white/60 hover:text-white"><X size={14} /></button>
      </div>
    </div>
  )
}

export default Toast
