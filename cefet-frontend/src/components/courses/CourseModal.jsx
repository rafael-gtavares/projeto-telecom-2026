import { useState, useEffect } from 'react'
import { X, Link, MapPin, User } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

const MODALITY_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'ead', label: 'EAD (Online)' },
  { value: 'semi_presencial', label: 'Semi-presencial' },
  { value: 'palestra', label: 'Palestra' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'outro', label: 'Outro' },
]

const INITIAL = {
  title: '',
  description: '',
  instructor: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  modality: 'presencial',
  location: '',
  maxSlots: '',
  status: 'published',
  imageUrl: '',
}

const CourseModal = ({ open, onClose, onSave, course, loading }) => {
  const [form, setForm] = useState(INITIAL)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (course && open) {
      // Extrai data e hora do startDate/endDate
      const startDT = course.startDate ? new Date(course.startDate) : null
      const endDT = course.endDate ? new Date(course.endDate) : null

      setForm({
        title: course.title || '',
        description: course.description || '',
        instructor: course.instructor || '',
        startDate: startDT ? startDT.toISOString().slice(0, 10) : '',
        startTime: startDT ? startDT.toTimeString().slice(0, 5) : '',
        endDate: endDT ? endDT.toISOString().slice(0, 10) : '',
        endTime: endDT ? endDT.toTimeString().slice(0, 5) : '',
        modality: course.modality || 'presencial',
        location: course.location || '',
        maxSlots: course.maxSlots || '',
        status: course.status || 'published',
        imageUrl: course.imageUrl || '',
      })
      setPreview(course.imageUrl || null)
    } else {
      setForm(INITIAL)
      setPreview(null)
    }
  }, [course, open])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const isFormValid =
    form.title.trim() &&
    form.description.trim() &&
    form.startDate &&
    form.startTime &&
    form.endDate &&
    form.endTime &&
    form.maxSlots

  const handleSubmit = () => {
    // Combina data + hora em ISO para enviar ao backend
    const startDate = new Date(`${form.startDate}T${form.startTime}:00`).toISOString()
    const endDate = new Date(`${form.endDate}T${form.endTime}:00`).toISOString()

    const payload = {
      title: form.title,
      description: form.description,
      instructor: form.instructor || '',
      startDate,
      endDate,
      modality: form.modality,
      location: form.modality !== 'ead' ? form.location : '',
      maxSlots: form.maxSlots,
      status: form.status,
      imageUrl: form.imageUrl || null,
    }
    onSave(payload)
  }

  const showLocation = ['presencial', 'semi_presencial', 'palestra', 'workshop', 'outro'].includes(form.modality)

  return (
    <Modal open={open} onClose={onClose} title={course ? 'Editar Curso' : 'Novo Curso'} size="lg">
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

        {/* Informações básicas */}
        <Input label="Título do curso" value={form.title} onChange={set('title')} placeholder="Ex: Redes de Telecomunicações" />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição</label>
          <textarea
            value={form.description} onChange={set('description')}
            rows={3} placeholder="Descreva o conteúdo do curso..."
            className="input-field resize-none w-full"
          />
        </div>

        <Input
          label="Instrutor / Palestrante"
          value={form.instructor}
          onChange={set('instructor')}
          placeholder="Ex: Prof. Ana Souza, Dr. Carlos Lima..."
          icon={User}
        />

        <hr className="border-border" />

        {/* Modalidade */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Modalidade</label>
          <select value={form.modality} onChange={set('modality')} className="input-field w-full">
            {MODALITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {showLocation && (
          <Input
            label="Local / Sala"
            value={form.location}
            onChange={set('location')}
            placeholder="Ex: Lab 3, Bloco A"
            icon={MapPin}
          />
        )}

        <hr className="border-border" />

        {/* Datas e horários */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Data e horário de início</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de início" type="date" value={form.startDate} onChange={set('startDate')} />
            <Input label="Hora de início" type="time" value={form.startTime} onChange={set('startTime')} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Data e horário de término</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de término" type="date" value={form.endDate} onChange={set('endDate')} />
            <Input label="Hora de término" type="time" value={form.endTime} onChange={set('endTime')} />
          </div>
        </div>

        <hr className="border-border" />

        {/* Vagas e status */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Vagas máximas" type="number" min="1" value={form.maxSlots} onChange={set('maxSlots')} placeholder="30" />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
            <select value={form.status} onChange={set('status')} className="input-field w-full">
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="closed">Encerrado</option>
            </select>
          </div>
        </div>

        {/* Imagem por URL */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Imagem de capa (URL)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => { setForm(f => ({ ...f, imageUrl: e.target.value })); setPreview(e.target.value || null) }}
                placeholder="https://exemplo.com/imagem.jpg"
                className="input-field pl-9"
              />
            </div>
            {form.imageUrl && (
              <button type="button" onClick={() => { setForm(f => ({ ...f, imageUrl: '' })); setPreview(null) }}
                className="p-3 rounded-btn border border-border text-text-muted hover:text-error hover:border-error transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          {preview && (
            <div className="mt-3 overflow-hidden rounded-card">
              <img src={preview} alt="preview" className="w-full h-36 object-cover" onError={() => setPreview(null)} />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="primary" className="flex-1" onClick={handleSubmit} loading={loading} disabled={!isFormValid}>
            {course ? 'Salvar alterações' : 'Criar curso'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default CourseModal