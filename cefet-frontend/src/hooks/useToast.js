import { useCallback, useState } from 'react'

// Hook genérico para o toast de feedback.
// Uso:
//   const { toast, showToast, closeToast } = useToast()
//   showToast('Situação atualizada')
//   <Toast show={toast.show} message={toast.message} onClose={closeToast} />
export function useToast() {
  const [toast, setToast] = useState({ show: false, message: '' })

  const showToast = useCallback((message) => setToast({ show: true, message }), [])
  const closeToast = () => setToast({ show: false, message: '' })

  return { toast, showToast, closeToast }
}

export default useToast
