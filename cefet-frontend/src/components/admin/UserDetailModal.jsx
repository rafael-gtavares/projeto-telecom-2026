import { useEffect, useState } from 'react'
import { Pencil, CheckCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Avatar } from '../ui/index'
import { updateUserPersonalInfoAPI } from '../../api/users'
import {
  formatDateShort,
  formatDateForInput,
  getGenderLabel,
  getSchoolLevelLabel,
  getIncomeLabel,
} from '../../utils/formatDate'

// Mesmo visual dos blocos de informação do CourseDetailModal
const Field = ({ label, children }) => (
  <div className="p-3 bg-surface-hover rounded-lg border border-border min-w-0">
    <p className="text-xs text-text-muted font-medium uppercase mb-0.5">{label}</p>
    <div className="text-sm font-semibold text-text-primary break-words">{children || '—'}</div>
  </div>
)

// Data de hoje no fuso local, em AAAA-MM-DD (limite do <input type="date">)
const todayInput = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// Modal "Dados cadastrais" — leitura de todos os dados e edição (apenas nome e
// data de nascimento) dentro do próprio modal. A API valida tudo de novo no backend.
const UserDetailModal = ({ open, user, schoolName, onClose, onUpdated }) => {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', birthDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  // Ao abrir (ou trocar de usuário) volta para o modo de leitura
  useEffect(() => {
    if (!open) return
    setEditing(false)
    setError(null)
    setSaved(false)
  }, [open, user?._id])

  if (!user) return null

  const startEdit = () => {
    setForm({ name: user.name || '', birthDate: formatDateForInput(user.birthDate) })
    setError(null)
    setSaved(false)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setError(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()

    const name = form.name.replace(/\s+/g, ' ').trim()
    if (name.length < 3) return setError('Informe o nome completo (mínimo de 3 caracteres).')
    if (user.birthDate && !form.birthDate) return setError('Informe a data de nascimento.')

    const payload = { name }
    if (form.birthDate) payload.birthDate = form.birthDate

    // Nada mudou: só sai do modo de edição
    if (name === user.name && (!form.birthDate || form.birthDate === formatDateForInput(user.birthDate))) {
      return setEditing(false)
    }

    setSaving(true)
    setError(null)
    try {
      const { data } = await updateUserPersonalInfoAPI(user._id, payload)
      onUpdated?.(data.data)
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar os dados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Dados cadastrais" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <p className="font-semibold text-text-primary break-words">{user.name}</p>
            <p className="text-sm text-text-muted break-all">{user.email}</p>
          </div>
        </div>

        {saved && !editing && (
          <div className="flex items-center gap-2 bg-success-light text-success-text text-xs font-medium rounded-lg px-3 py-2">
            <CheckCircle size={14} /> Dados atualizados com sucesso.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {editing ? (
              <>
                <div className="sm:col-span-2">
                  <Input
                    label="Nome completo"
                    value={form.name}
                    maxLength={120}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    disabled={saving}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Data de nascimento"
                    type="date"
                    min="1900-01-01"
                    max={todayInput()}
                    value={form.birthDate}
                    onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="sm:col-span-2"><Field label="Nome completo">{user.name}</Field></div>
                <Field label="Data de nascimento">{formatDateShort(user.birthDate)}</Field>
                <Field label="Sexo">{getGenderLabel(user.gender)}</Field>
              </>
            )}

            {editing && <Field label="Sexo">{getGenderLabel(user.gender)}</Field>}
            <Field label="Nível escolar">{getSchoolLevelLabel(user.schoolLevel)}</Field>
            <Field label="Escola de origem">{schoolName || 'Outras / não informada'}</Field>
            <Field label="Renda per capita">{getIncomeLabel(user.incomeRange)}</Field>
          </div>

          {error && <p className="text-sm text-error-text">{error}</p>}

          {editing ? (
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" loading={saving}>
                Salvar alterações
              </Button>
              <Button type="button" variant="secondary" onClick={cancelEdit} disabled={saving}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" className="w-full gap-2" onClick={startEdit}>
              <Pencil size={15} /> Editar nome e data de nascimento
            </Button>
          )}
        </form>
      </div>
    </Modal>
  )
}

export default UserDetailModal