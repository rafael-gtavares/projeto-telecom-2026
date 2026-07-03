import { useState } from 'react'

// Hook genérico para o modal de confirmação (substitui window.confirm).
// Uso:
//   const { confirmModal, confirm, close } = useConfirmModal()
//   confirm('Deseja excluir esta aula?', async () => { ... })
//   <Modal open={confirmModal.open} onClose={close} ...>
export function useConfirmModal() {
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null })

  const confirm = (message, onConfirm) => {
    setConfirmModal({ open: true, message, onConfirm })
  }

  const close = () => setConfirmModal({ open: false, message: '', onConfirm: null })

  const handleConfirm = async () => {
    const { onConfirm } = confirmModal
    close()
    if (onConfirm) await onConfirm()
  }

  return { confirmModal, confirm, close, handleConfirm }
}

export default useConfirmModal
