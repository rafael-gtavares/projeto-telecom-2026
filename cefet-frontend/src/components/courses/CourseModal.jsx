import { useState, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

const INITIAL = { title: '', description: '', date: '', time: '', professor: '', maxSlots: '', status: 'published' }

const CourseModal = ({ open, onClose, onSave, course, loading }) => {
  const [form, setForm] = useState(INITIAL)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || '',
        description: course.description || '',
        date: course.date ? course.date.slice(0, 10) : '',
        time: course.time || '',
        professor: course.professor || '',
        maxSlots: course.maxSlots || '',
        status: course.status || 'published',
      })
      setPreview(course.imageUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${course.imageUrl}` : null)
    } else {
      setForm(INITIAL)
      setPreview(null)
      setImage(null)
    }
  }, [course, open])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleFile = (file) => {
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }

  const handleSubmit = () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (image) fd.append('image', image)
    onSave(fd)
  }

  return (
    <Modal open={open} onClose={onClose} title={course ? 'Editar Curso' : 'Novo Curso'} size="lg">
      <div className="space-y-4">
        <Input label="Título do curso" value={form.title} onChange={set('title')} placeholder="Ex: Redes de Telecomunicações" />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição</label>
          <textarea
            value={form.description} onChange={set('description')}
            rows={3} placeholder="Descreva o conteúdo do curso..."
            className="input-field resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Data" type="date" value={form.date} onChange={set('date')} />
          <Input label="Horário" type="time" value={form.time} onChange={set('time')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Vagas máximas" type="number" min="1" value={form.maxSlots} onChange={set('maxSlots')} placeholder="30" />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
            <select value={form.status} onChange={set('status')} className="input-field">
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="closed">Encerrado</option>
            </select>
          </div>
        </div>
        <Input label="Nome do professor responsável" value={form.professor} onChange={set('professor')} placeholder="Nome do professor" />

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
