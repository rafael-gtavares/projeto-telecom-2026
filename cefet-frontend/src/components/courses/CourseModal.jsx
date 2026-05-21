import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Link } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import getDayName from '../../utils/getDayName'

const INITIAL = {
  title: '',
  description: '',
  professor: '',
  maxSlots: '',
  status: 'published',
  startDate: '',
  endDate: '',
  imageUrl: '',
  schedule: [{ dayOfWeek: 'Segunda', startTime: '', endTime: '', location: '' }]
}

const CourseModal = ({ open, onClose, onSave, course, loading }) => {
  const [form, setForm] = useState(INITIAL)
  const [isRecurring, setIsRecurring] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (course && open) {
      // Checa se o curso tem datas diferentes para definir se é recorrente
      const start = course.startDate ? course.startDate.slice(0, 10) : ''
      const end = course.endDate ? course.endDate.slice(0, 10) : ''
      const recurring = start !== end || (course.schedule && course.schedule.length > 1)

      setIsRecurring(recurring)
      setForm({
        title: course.title || '',
        description: course.description || '',
        professor: course.professor || '',
        maxSlots: course.maxSlots || '',
        status: course.status || 'published',
        startDate: start,
        endDate: end,
        imageUrl: course.imageUrl || '',
        schedule: course.schedule?.length ? course.schedule : INITIAL.schedule
      })
      setPreview(course.imageUrl || null)
    } else {
      setForm(INITIAL)
      setIsRecurring(false)
      setPreview(null)
    }
  }, [course, open])

  // Atualiza campos simples
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Gerenciamento do array dinâmico de horários
  const addScheduleItem = () => {
    setForm(f => ({
      ...f,
      schedule: [...f.schedule, { dayOfWeek: 'Segunda', startTime: '', endTime: '', location: '' }]
    }))
  }

  const removeScheduleItem = (index) => {
    setForm(f => ({
      ...f,
      schedule: f.schedule.filter((_, i) => i !== index)
    }))
  }

  const updateScheduleItem = (index, field, value) => {
    const newSchedule = [...form.schedule]
    newSchedule[index][field] = value
    setForm({ ...form, schedule: newSchedule })
  }



  const isFormValid =
    form.title.trim() &&
    form.description.trim() &&
    form.professor.trim() &&
    form.maxSlots &&
    form.startDate &&
    form.schedule.every(s =>
      s.startTime && s.endTime && s.location
    )

  const handleSubmit = () => {
    const finalEndDate = isRecurring ? form.endDate : form.startDate

    const payload = {
      title: form.title,
      description: form.description,
      professor: form.professor,
      maxSlots: form.maxSlots,
      status: form.status,
      startDate: form.startDate,
      endDate: finalEndDate,
      schedule: form.schedule,
      imageUrl: form.imageUrl || null,
    }

    onSave(payload)
  }

  const handleStartDateChange = (e) => {
    const newDate = e.target.value;

    setForm(prev => {
      // 1. Criamos a base do novo formulário
      const updatedForm = { ...prev, startDate: newDate };

      // 2. Só calculamos o dia se houver uma data válida e NÃO for curso recorrente
      if (!isRecurring && newDate) {
        const dayName = getDayName(newDate);

        // 3. Criamos uma cópia profunda do primeiro item do schedule ou usamos o padrão
        const firstSession = prev.schedule[0] ? { ...prev.schedule[0] } : { ...INITIAL.schedule[0] };

        // 4. Injetamos o dia da semana calculado
        firstSession.dayOfWeek = dayName;

        // 5. Atualizamos o array de schedule com esse item modificado
        updatedForm.schedule = [firstSession];
      }

      return updatedForm;
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={course ? 'Editar Curso' : 'Novo Curso'} size="lg">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 sm:pr-4 px-2">

        {/* Informações Básicas */}
        <div className="space-y-4">
          <Input label="Título do curso" value={form.title} onChange={set('title')} placeholder="Ex: Redes de Telecomunicações" />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição</label>
            <textarea
              value={form.description} onChange={set('description')}
              rows={3} placeholder="Descreva o conteúdo do curso..."
              className="input-field resize-none w-full min-h-[96px]"
            />
          </div>
        </div>

        <hr className="border-border" />

        {/* Configuração de Datas e Horários */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Datas e Horários</h3>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-text-secondary">Curso com múltiplos dias</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={isRecurring ? "Data de Início" : "Data do Curso"}
              type="date"
              value={form.startDate}
              onChange={handleStartDateChange}
            />
            {isRecurring && (
              <Input
                label="Data de Término"
                type="date"
                value={form.endDate}
                onChange={set('endDate')}
              />
            )}
          </div>

          {/* Lista Dinâmica de Sessões */}
          <div className="space-y-3 mt-4">
            {form.schedule.map((item, index) => (
              <div key={index} className="p-4 bg-surface border border-border rounded-lg relative shadow-sm">
                {isRecurring && form.schedule.length > 1 && (
                  <button
                    onClick={() => removeScheduleItem(index)}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1.5 hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full justify-between">
                  {isRecurring && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Dia</label>
                      <select
                        value={item.dayOfWeek}
                        onChange={(e) => updateScheduleItem(index, 'dayOfWeek', e.target.value)}
                        className="input-field w-full"
                      >
                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Input label="Início" type="time" value={item.startTime} onChange={(e) => updateScheduleItem(index, 'startTime', e.target.value)} />
                  <Input label="Fim" type="time" value={item.endTime} onChange={(e) => updateScheduleItem(index, 'endTime', e.target.value)} />
                  <Input label="Sala/Local" value={item.location} onChange={(e) => updateScheduleItem(index, 'location', e.target.value)} placeholder="Ex: Lab 1" />
                </div>
              </div>
            ))}

            {isRecurring && (
              <Button variant="secondary" onClick={addScheduleItem} className="w-full flex justify-center items-center gap-2">
                <Plus size={16} /> Adicionar outro horário
              </Button>
            )}
          </div>
        </div>

        <hr className="border-border" />

        {/* Outras Informações */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Vagas máximas" type="number" min="1" value={form.maxSlots} onChange={set('maxSlots')} placeholder="30" />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
            <select value={form.status} onChange={set('status')} className="input-field w-full">
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="closed">Encerrado</option>
            </select>
          </div>
        </div>
        <Input label="Nome do professor responsável" value={form.professor} onChange={set('professor')} placeholder="Nome do professor" />

        {/* URL da Imagem */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Imagem de capa (URL)
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => {
                  const url = e.target.value
                  setForm(f => ({ ...f, imageUrl: url }))
                  setPreview(url || null)
                }}
                placeholder="https://exemplo.com/imagem.jpg"
                className="input-field pl-9"
              />
            </div>

            {form.imageUrl && (
              <button
                type="button"
                onClick={() => {
                  setForm(f => ({ ...f, imageUrl: '' }))
                  setPreview(null)
                }}
                className="p-3 rounded-btn border border-border text-text-muted hover:text-error hover:border-error transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <p className="text-xs text-text-muted mt-1.5">
            Cole a URL de uma imagem pública (JPG, PNG, WebP)
          </p>

          {preview && (
            <div className="mt-3 relative overflow-hidden rounded-card">
              <img
                src={preview}
                alt="Preview da capa"
                className="w-full h-40 object-cover"
                onError={() => setPreview(null)}
              />
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
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default CourseModal