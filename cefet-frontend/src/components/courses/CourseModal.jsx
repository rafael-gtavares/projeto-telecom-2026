import { useState, useEffect } from 'react'
import { X, Link, MapPin, User } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import {
  ScheduleTypePicker,
  SingleScheduleFields,
  WeeklyScheduleFields,
  CustomScheduleFields,
} from './schedule/index'

const MODALITY_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'ead', label: 'EAD (Online)' },
  { value: 'semi_presencial', label: 'Semi-presencial' },
  { value: 'palestra', label: 'Palestra' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'outro', label: 'Outro' },
]

const INITIAL_SINGLE = [{ date: '', startTime: '', endTime: '' }]
const INITIAL_WEEKLY = { startDate: '', endDate: '', weekdays: [] }
const INITIAL_CUSTOM = [{ date: '', startTime: '', endTime: '' }]

const INITIAL = {
  title: '',
  description: '',
  instructor: '',
  modality: 'presencial',
  location: '',
  maxSlots: '',
  status: 'published',
  imageUrl: '',
  scheduleType: 'single',
  // campos de schedule
  singleConfig: INITIAL_SINGLE,
  weeklyConfig: INITIAL_WEEKLY,
  customConfig: INITIAL_CUSTOM,
}

// ─── helpers de parse ────────────────────────────────────────────────────────

/** Converte o course do backend para o estado do formulário */
const parseCourseToForm = (course) => {
  const base = {
    title: course.title || '',
    description: course.description || '',
    instructor: course.instructor || '',
    modality: course.modality || 'presencial',
    location: course.location || '',
    maxSlots: course.maxSlots || '',
    status: course.status || 'published',
    imageUrl: course.imageUrl || '',
    scheduleType: course.scheduleType || 'single',
    singleConfig: INITIAL_SINGLE,
    weeklyConfig: INITIAL_WEEKLY,
    customConfig: INITIAL_CUSTOM,
  }

  const cfg = course.scheduleConfig || []
  const type = course.scheduleType

  if (type === 'single') {
    base.singleConfig = cfg.length
      ? [{ date: cfg[0].date || '', startTime: cfg[0].startTime || '', endTime: cfg[0].endTime || '' }]
      : INITIAL_SINGLE
  } else if (type === 'weekly') {
    base.weeklyConfig = {
      startDate: course.startDate || '',
      endDate: course.endDate || '',
      weekdays: cfg.map((c) => ({
        weekday: c.weekday,
        startTime: c.startTime || '',
        endTime: c.endTime || '',
      })),
    }
  } else if (type === 'custom') {
    base.customConfig = cfg.length
      ? cfg.map((c) => ({ date: c.date || '', startTime: c.startTime || '', endTime: c.endTime || '' }))
      : INITIAL_CUSTOM
  }

  return base
}

/** Monta o payload para o backend conforme scheduleType */
const buildPayload = (form) => {
  const base = {
    title: form.title,
    description: form.description,
    instructor: form.instructor || '',
    modality: form.modality,
    location: ['presencial', 'semi_presencial', 'palestra', 'workshop', 'outro'].includes(form.modality)
      ? form.location
      : '',
    maxSlots: form.maxSlots,
    status: form.status,
    imageUrl: form.imageUrl || null,
    scheduleType: form.scheduleType,
  }

  if (form.scheduleType === 'single') {
    const c = form.singleConfig[0]
    base.scheduleConfig = [{ date: c.date, startTime: c.startTime, endTime: c.endTime }]
  } else if (form.scheduleType === 'weekly') {
    const { startDate, endDate, weekdays } = form.weeklyConfig
    base.startDate = startDate
    base.endDate = endDate
    base.scheduleConfig = weekdays.map((w) => ({
      weekday: w.weekday,
      startTime: w.startTime,
      endTime: w.endTime,
    }))
  } else if (form.scheduleType === 'custom') {
    base.scheduleConfig = form.customConfig.map((c) => ({
      date: c.date,
      startTime: c.startTime,
      endTime: c.endTime,
    }))
  }

  return base
}

// ─── validação ───────────────────────────────────────────────────────────────

const isScheduleValid = (form) => {
  if (form.scheduleType === 'single') {
    const c = form.singleConfig[0]
    return !!(c.date && c.startTime && c.endTime)
  }
  if (form.scheduleType === 'weekly') {
    const { startDate, endDate, weekdays } = form.weeklyConfig
    return !!(
      startDate &&
      endDate &&
      weekdays.length > 0 &&
      weekdays.every((w) => w.startTime && w.endTime)
    )
  }
  if (form.scheduleType === 'custom') {
    return (
      form.customConfig.length > 0 &&
      form.customConfig.every((c) => c.date && c.startTime && c.endTime)
    )
  }
  return false
}

// ─── Componente ──────────────────────────────────────────────────────────────

const CourseModal = ({ open, onClose, onSave, course, loading }) => {
  const [form, setForm] = useState(INITIAL)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (course && open) {
      const parsed = parseCourseToForm(course)
      setForm(parsed)
      setPreview(course.imageUrl || null)
    } else {
      setForm(INITIAL)
      setPreview(null)
    }
  }, [course, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const isFormValid =
    form.title.trim() &&
    form.description.trim() &&
    form.maxSlots &&
    isScheduleValid(form)

  const handleSubmit = () => {
    if (!isFormValid) return
    onSave(buildPayload(form))
  }

  const showLocation = ['presencial', 'semi_presencial', 'palestra', 'workshop', 'outro'].includes(form.modality)

  return (
    <Modal open={open} onClose={onClose} title={course ? 'Editar Curso' : 'Novo Curso'} size="lg">
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

        {/* Informações básicas */}
        <Input
          label="Título do curso *"
          value={form.title}
          onChange={set('title')}
          placeholder="Ex: Redes de Telecomunicações"
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição *</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            placeholder="Descreva o conteúdo do curso..."
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

        {/* Modalidade e local */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Modalidade</label>
          <select value={form.modality} onChange={set('modality')} className="input-field w-full">
            {MODALITY_OPTIONS.map((o) => (
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

        {/* Agenda */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Agenda de aulas</h3>

          <ScheduleTypePicker
            value={form.scheduleType}
            onChange={(type) => setForm((f) => ({ ...f, scheduleType: type }))}
          />

          {form.scheduleType === 'single' && (
            <SingleScheduleFields
              config={form.singleConfig[0]}
              onChange={(cfg) => setForm((f) => ({ ...f, singleConfig: [cfg] }))}
            />
          )}

          {form.scheduleType === 'weekly' && (
            <WeeklyScheduleFields
              config={form.weeklyConfig}
              onChange={(cfg) => setForm((f) => ({ ...f, weeklyConfig: cfg }))}
            />
          )}

          {form.scheduleType === 'custom' && (
            <CustomScheduleFields
              config={form.customConfig}
              onChange={(cfg) => setForm((f) => ({ ...f, customConfig: cfg }))}
            />
          )}
        </div>

        <hr className="border-border" />

        {/* Vagas e status */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Vagas máximas *"
            type="number"
            min="1"
            value={form.maxSlots}
            onChange={set('maxSlots')}
            placeholder="30"
          />
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
                onChange={(e) => {
                  setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  setPreview(e.target.value || null)
                }}
                placeholder="https://exemplo.com/imagem.jpg"
                className="input-field pl-9"
              />
            </div>
            {form.imageUrl && (
              <button
                type="button"
                onClick={() => { setForm((f) => ({ ...f, imageUrl: '' })); setPreview(null) }}
                className="p-3 rounded-btn border border-border text-text-muted hover:text-error hover:border-error transition-colors"
              >
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
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSubmit}
            loading={loading}
            disabled={!isFormValid}
          >
            {course ? 'Salvar alterações' : 'Criar curso'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CourseModal