import { useEffect, useState } from 'react'
import Modal from '../../../ui/Modal'
import Button from '../../../ui/Button'
import Input from '../../../ui/Input'
import { GRADING_METHODS } from '../../../../constants/gradingMethods'

const EMPTY = { title: '', type: 'prova', maxScore: 10, weight: 1 }

// Modal de criar/editar uma avaliação. Os campos "vale (pontos)" e "peso"
// aparecem conforme o método de cálculo do curso.
const AssessmentFormModal = ({ open, assessment, method, onClose, onSave, saving }) => {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (!open) return
    setForm(assessment
      ? {
          title: assessment.title || '',
          type: assessment.type || 'prova',
          maxScore: assessment.maxScore ?? 10,
          weight: assessment.weight ?? 1,
        }
      : EMPTY)
  }, [open, assessment])

  const isSum = method === GRADING_METHODS.SUM
  const isWeighted = method === GRADING_METHODS.WEIGHTED

  const handleSave = () => {
    if (!form.title.trim()) return
    const payload = {
      title: form.title.trim(),
      type: form.type,
      // No modo soma, maxScore é quanto vale; nos demais a nota é 0–10.
      maxScore: isSum ? Number(form.maxScore) || 10 : 10,
      weight: isWeighted ? Number(form.weight) || 1 : 1,
    }
    onSave(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={assessment ? 'Editar avaliação' : 'Nova avaliação'} size="sm">
      <div className="space-y-4">
        <Input
          label="Título da avaliação *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Ex: Prova 1, Trabalho Final"
          maxLength={120}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Tipo</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="input-field w-full"
          >
            <option value="prova">Prova</option>
            <option value="trabalho">Trabalho</option>
            <option value="participacao">Participação</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        {isSum && (
          <Input
            label="Vale quantos pontos"
            type="number" min="0.5" max="1000" step="0.5"
            value={form.maxScore}
            onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))}
          />
        )}

        {isWeighted && (
          <Input
            label="Peso"
            type="number" min="0" max="100" step="0.5"
            value={form.weight}
            onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
          />
        )}

        {!isSum && (
          <p className="text-xs text-text-muted bg-surface-page px-3 py-2 rounded-lg">
            A nota desta avaliação vai de <strong>0 a 10</strong>.
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving}>
            {assessment ? 'Salvar' : 'Criar avaliação'}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default AssessmentFormModal
