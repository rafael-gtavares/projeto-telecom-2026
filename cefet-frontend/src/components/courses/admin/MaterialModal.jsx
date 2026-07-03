import { useEffect, useState } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

const EMPTY_FORM = { title: '', type: 'text', content: '', description: '', file: null }

const MaterialModal = ({ open, material, onClose, onSave, saving }) => {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open && material) {
      setForm({
        title: material.title || '',
        type: material.type || 'text',
        content: material.content || '',
        description: material.description || '',
        file: null,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, material])

  const handleFileChange = (e) => {
    setForm(f => ({ ...f, file: e.target.files[0] }))
  }

  const handleSave = () => {
    if (!form.title) return
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={material ? 'Editar material' : 'Novo material'} size="md">
      <div className="space-y-4">
        <Input
          label="Título *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Tipo *</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="input-field w-full"
          >
            <option value="text">Leitura</option>
            <option value="file">Arquivo</option>
            <option value="link">Link Externo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {form.type === 'text'
              ? 'Conteúdo (texto)'
              : form.type === 'file'
                ? 'Arquivo'
                : 'URL do link'}
          </label>

          {form.type === 'text' ? (
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={5}
              className="input-field w-full resize-none"
              placeholder="Digite o conteúdo de leitura..."
            />
          ) : form.type === 'link' ? (
            <input
              type="url"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="input-field w-full"
              placeholder="https://..."
            />
          ) : (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-surface-secondary transition-colors">
                <div className="text-center">
                  <p className="font-medium">Clique para selecionar um arquivo</p>
                  <p className="text-sm text-text-secondary mt-1">PDF, DOCX, PPTX, ZIP...</p>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>

              {form.file && (
                <div className="mt-2 text-sm text-text-secondary">
                  Arquivo selecionado: <span className="font-medium">{form.file.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="input-field w-full resize-none"
            placeholder="Descrição opcional..."
          />
        </div>

        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving}>
            {material ? 'Salvar' : 'Criar material'}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default MaterialModal
