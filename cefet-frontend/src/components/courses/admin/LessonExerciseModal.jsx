import { useEffect, useState } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import ExerciseBuilder from '../../exercises/ExerciseBuilder'

const LessonExerciseModal = ({ open, lesson, onClose, onSave, saving }) => {
  const [draft, setDraft] = useState([])

  useEffect(() => {
    setDraft((lesson?.exercises || []).map(q => ({
      _key: crypto.randomUUID(),
      question: q.question || '',
      options: q.options?.length ? [...q.options] : ['', ''],
      correctIndex: q.correctIndex ?? 0,
    })))
  }, [lesson])

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={`Exercícios — ${lesson?.title || 'Aula'}`}
      size="xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Crie questões de múltipla escolha. O aluno responde no fim do conteúdo e vê na hora os
          acertos/erros (autoavaliação — nada é salvo).
        </p>
        <ExerciseBuilder value={draft} onChange={setDraft} />
        <div className="flex gap-3 pt-2">
          <Button variant="primary" className="flex-1" onClick={() => onSave(draft)} loading={saving}>
            Salvar exercícios
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default LessonExerciseModal
