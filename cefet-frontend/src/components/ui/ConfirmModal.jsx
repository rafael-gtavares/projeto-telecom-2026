import Modal from './Modal'
import Button from './Button'

// Renderiza o estado produzido por useConfirmModal.
// Uso:
//   const { confirmModal, close, handleConfirm } = useConfirmModal()
//   <ConfirmModal confirmModal={confirmModal} onClose={close} onConfirm={handleConfirm} />
const ConfirmModal = ({ confirmModal, onClose, onConfirm, title = 'Confirmar' }) => (
  <Modal open={confirmModal.open} onClose={onClose} title={title} size="sm">
    <p className="text-text-secondary text-sm mb-5">{confirmModal.message}</p>
    <div className="flex gap-3">
      <button onClick={onConfirm} className="flex-1 btn-primary justify-center">
        Confirmar
      </button>
      <Button variant="secondary" onClick={onClose}>
        Cancelar
      </Button>
    </div>
  </Modal>
)

export default ConfirmModal
