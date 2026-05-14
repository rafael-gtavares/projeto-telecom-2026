import { useState, useEffect } from 'react'
import { Upload, X, Plus, Trash2 } from 'lucide-react'
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
  schedule: [{ dayOfWeek: 'Segunda', startTime: '', endTime: '', location: '' }]
}

const CourseModal = ({ open, onClose, onSave, course, loading }) => {
  const [form, setForm] = useState(INITIAL)
  const [isRecurring, setIsRecurring] = useState(false)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)

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
        schedule: course.schedule?.length ? course.schedule : INITIAL.schedule
      })
      setPreview(course.imageUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${course.imageUrl}` : null)
    } else {
      setForm(INITIAL)
      setIsRecurring(false)
      setPreview(null)
      setImage(null)
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

  const handleFile = (file) => {
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }

  const handleSubmit = () => {
    const fd = new FormData()

    // Se for curso de 1 dia, a data final é igual à data inicial
    const finalEndDate = isRecurring ? form.endDate : form.startDate

    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('professor', form.professor)
    fd.append('maxSlots', form.maxSlots)
    fd.append('status', form.status)
    fd.append('startDate', form.startDate)
    fd.append('endDate', finalEndDate)

    // Transformamos o array de objetos em uma string JSON para enviar via FormData
    fd.append('schedule', JSON.stringify(form.schedule))

    if (image) fd.append('image', image)
    onSave(fd)
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
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">

        {/* Informações Básicas */}
        <div className="space-y-4">
          <Input label="Título do curso" value={form.title} onChange={set('title')} placeholder="Ex: Redes de Telecomunicações" />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição</label>
            <textarea
              value={form.description} onChange={set('description')}
              rows={3} placeholder="Descreva o conteúdo do curso..."
              className="input-field resize-none w-full"
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
              <div key={index} className="p-4 bg-surface-hover border border-border rounded-lg relative">
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

        {/* Upload de Imagem */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Imagem de capa</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-card p-6 text-center transition-colors ${dragOver ? 'border-primary bg-surface-hover' : 'border-border hover:border-primary'}`}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={() => { setPreview(null); setImage(null) }} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-card"><X size={14} /></button>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-text-muted mb-2" />
                <p className="text-sm text-text-secondary">Arraste ou <label className="text-primary cursor-pointer font-medium"><input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />clique para enviar</label></p>
                <p className="text-xs text-text-muted mt-1">PNG, JPG até 5MB</p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="primary" className="flex-1" onClick={handleSubmit} loading={loading}>
            {course ? 'Salvar alterações' : 'Criar curso'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default CourseModal