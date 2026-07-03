import { useEffect, useState } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import MarkdownEditor from '../../markdown/MarkdownEditor'

const LessonContentModal = ({ open, lesson, onClose, onSave, saving }) => {
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setDraft(lesson?.content || '')
  }, [lesson])

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={`Conteúdo — ${lesson?.title || 'Aula'}`}
      size="xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Escreva o conteúdo da aula em Markdown. Use a barra de ferramentas, cole links do YouTube
          (viram player) e imagens. A pré-visualização mostra como o aluno verá.
        </p>
        <MarkdownEditor value={draft} onChange={setDraft} />
        <div className="flex gap-3 pt-2">
          <Button variant="primary" className="flex-1" onClick={() => onSave(draft)} loading={saving}>
            Salvar conteúdo
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default LessonContentModal
