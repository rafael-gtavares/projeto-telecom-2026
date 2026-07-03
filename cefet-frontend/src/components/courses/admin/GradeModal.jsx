import { useEffect, useState } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

const EMPTY_FORM = { title: '', type: 'prova', grade: '', feedback: '' }

const GradeModal = ({ open, onClose, onSave, saving }) => {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!open) setForm(EMPTY_FORM)
  }, [open])

  const handleSave = () => {
    if (!form.title || !form.grade) return
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title="Lançar nota" size="sm">
      <div className="space-y-4">
        <Input
          label="Título da avaliação *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Ex: Prova 1"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Tipo</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="input-field w-full"
            >
              <option value="prova">Prova</option>
              <option value="trabalho">Trabalho</option>
              <option value="exercicio">Exercício</option>
              <option value="participacao">Participação</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <Input
            label="Nota (0-10)"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={form.grade}
            onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Feedback (opcional)</label>
          <textarea
            value={form.feedback}
            onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))}
            rows={2}
            className="input-field w-full resize-none"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving}>
            Lançar nota
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default GradeModal
