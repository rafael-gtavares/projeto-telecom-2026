import { useEffect, useState } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

const EMPTY_FORM = { title: '', message: '', audience: 'all', recipients: [] }

// students = inscrições com .user populado (name/email)
const AnnouncementModal = ({ open, students = [], onClose, onSave, saving }) => {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setForm(EMPTY_FORM); setError('') }
  }, [open])

  // Lista de alunos { _id, name } a partir das inscrições
  const studentUsers = students.map((e) => e.user || e).filter(Boolean)
  const allSelected = studentUsers.length > 0 && form.recipients.length === studentUsers.length

  const toggleRecipient = (id) => {
    setForm((f) => ({
      ...f,
      recipients: f.recipients.includes(id)
        ? f.recipients.filter((r) => r !== id)
        : [...f.recipients, id],
    }))
  }

  const toggleAll = () => {
    setForm((f) => ({
      ...f,
      recipients: allSelected ? [] : studentUsers.map((u) => u._id),
    }))
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.message.trim()) {
      setError('Preencha título e mensagem.')
      return
    }
    if (form.audience === 'individual' && form.recipients.length === 0) {
      setError('Selecione ao menos um aluno.')
      return
    }
    onSave({
      title: form.title.trim(),
      message: form.message.trim(),
      audience: form.audience,
      recipients: form.audience === 'individual' ? form.recipients : [],
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo aviso" size="md">
      <div className="space-y-4">
        <Input
          label="Título *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Ex.: Aula de sexta remarcada"
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Mensagem *</label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={4}
            className="input-field w-full resize-none"
            placeholder="Escreva o comunicado..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Enviar para</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, audience: 'all' }))}
              className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                form.audience === 'all'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-text-secondary hover:border-primary/40'
              }`}
            >
              Turma toda
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, audience: 'individual' }))}
              className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                form.audience === 'individual'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-text-secondary hover:border-primary/40'
              }`}
            >
              Alunos específicos
            </button>
          </div>
        </div>

        {form.audience === 'individual' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-text-secondary">
                Alunos * {form.recipients.length > 0 && (
                  <span className="text-text-muted font-normal">({form.recipients.length} selecionado{form.recipients.length > 1 ? 's' : ''})</span>
                )}
              </label>
              {studentUsers.length > 0 && (
                <button type="button" onClick={toggleAll} className="text-xs text-primary hover:underline font-medium">
                  {allSelected ? 'Limpar' : 'Selecionar todos'}
                </button>
              )}
            </div>

            {studentUsers.length === 0 ? (
              <p className="text-xs text-text-muted">Nenhum aluno inscrito para avisar individualmente.</p>
            ) : (
              <div className="max-h-52 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {studentUsers.map((u) => {
                  const checked = form.recipients.includes(u._id)
                  return (
                    <label
                      key={u._id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-primary/5' : 'hover:bg-surface-hover'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(u._id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary flex-shrink-0"
                      />
                      <span className="text-sm text-text-primary truncate">{u.name}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving}>
            Enviar aviso
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default AnnouncementModal
