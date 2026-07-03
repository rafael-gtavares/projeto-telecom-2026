import { useEffect, useState } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { parseUTCDate } from '../../../utils/formatDate'

const EMPTY_FORM = { title: '', date: '', modality: 'presencial', startTime: '', endTime: '', location: '', meetingUrl: '', description: '' }

const LessonModal = ({ open, lesson, onClose, onSave, saving }) => {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open && lesson) {
      setForm({
        title: lesson.title || '',
        date: lesson.date ? parseUTCDate(lesson.date).toISOString().slice(0, 10) : '',
        modality: lesson.modality || 'presencial',
        startTime: lesson.startTime || '',
        endTime: lesson.endTime || '',
        location: lesson.location || '',
        meetingUrl: lesson.meetingUrl || '',
        description: lesson.description || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, lesson])

  const handleSave = () => {
    if (!form.title || !form.date || !form.startTime || !form.endTime) return
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={lesson ? 'Editar aula' : 'Nova aula'} size="md">
      <div className="space-y-4">
        <Input label="Título da aula *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Data *" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Modalidade</label>
            <select value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))} className="input-field w-full">
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Início *" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
          <Input label="Fim *" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
        </div>
        <Input label="Local / Sala" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Lab 2" />
        <Input label="Link da aula (online)" type="url" value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))} placeholder="https://meet.google.com/..." />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input-field w-full resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving}>
            {lesson ? 'Salvar' : 'Criar aula'}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default LessonModal
