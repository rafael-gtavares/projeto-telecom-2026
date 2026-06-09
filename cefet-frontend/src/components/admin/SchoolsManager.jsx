import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, School, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import { Badge, Spinner } from '../ui/index'
import {
  getAllSchoolsAPI,
  createSchoolAPI,
  updateSchoolAPI,
  deleteSchoolAPI,
} from '../../api/users'

const INITIAL_FORM = { name: '', city: '', active: true }

const SchoolsManager = () => {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal de criação/edição
  const [modal, setModal] = useState({ open: false, school: null })
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  // Modal de confirmação de exclusão
  const [deleteModal, setDeleteModal] = useState({ open: false, school: null })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getAllSchoolsAPI()
      setSchools(data.data)
    } catch {
      setSchools([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm(INITIAL_FORM)
    setFormError('')
    setModal({ open: true, school: null })
  }

  const openEdit = (school) => {
    setForm({ name: school.name, city: school.city || '', active: school.active })
    setFormError('')
    setModal({ open: true, school })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Nome da escola é obrigatório'); return }
    setSaveLoading(true)
    setFormError('')
    try {
      if (modal.school) {
        const { data } = await updateSchoolAPI(modal.school._id, form)
        setSchools(prev => prev.map(s => s._id === data.data._id ? data.data : s))
      } else {
        const { data } = await createSchoolAPI(form)
        setSchools(prev => [data.data, ...prev])
      }
      setModal({ open: false, school: null })
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erro ao salvar escola')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleToggleActive = async (school) => {
    try {
      const { data } = await updateSchoolAPI(school._id, { active: !school.active })
      setSchools(prev => prev.map(s => s._id === data.data._id ? data.data : s))
    } catch (err) {
      // falha silenciosa — pode adicionar toast se desejar
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.school) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteSchoolAPI(deleteModal.school._id)
      setSchools(prev => prev.filter(s => s._id !== deleteModal.school._id))
      setDeleteModal({ open: false, school: null })
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Erro ao excluir escola')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filtered = schools.filter(s =>
    !search.trim() ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <Button
          variant="primary"
          className="gap-2 text-sm py-2 px-4"
          onClick={openCreate}
        >
          <Plus size={15} /> Nova escola
        </Button>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          placeholder="Buscar escola ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 text-sm py-2.5 w-full"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <School size={28} className="mx-auto text-text-muted mb-2 opacity-50" />
          <p className="text-sm text-text-muted">
            {search ? 'Nenhuma escola encontrada para esta busca.' : 'Nenhuma escola cadastrada ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(school => (
            <div
              key={school._id}
              className={`flex items-center gap-3 p-3 border rounded-card transition-all ${school.active
                ? 'border-border hover:border-primary bg-white'
                : 'border-border bg-surface-page opacity-60'
                }`}
            >
              <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center flex-shrink-0">
                <School size={14} className="text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{school.name}</p>
                {school.city && (
                  <p className="text-xs text-text-muted">{school.city}</p>
                )}
              </div>

              <Badge variant={school.active ? 'success' : 'gray'}>
                {school.active ? 'Ativa' : 'Inativa'}
              </Badge>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Toggle ativo/inativo */}
                <button
                  onClick={() => handleToggleActive(school)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                  title={school.active ? 'Desativar escola' : 'Ativar escola'}
                >
                  {school.active
                    ? <ToggleRight size={16} className="text-success" />
                    : <ToggleLeft size={16} />
                  }
                </button>

                <button
                  onClick={() => openEdit(school)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  onClick={() => { setDeleteError(''); setDeleteModal({ open: true, school }) }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, school: null })}
        title={modal.school ? 'Editar escola' : 'Nova escola'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nome da escola *"
            value={form.name}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError('') }}
            placeholder="Ex: Escola Estadual João Silva"
            error={formError}
          />
          <Input
            label="Cidade"
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="Ex: Rio de Janeiro"
          />

          {modal.school && (
            <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-lg border border-border hover:border-primary transition-colors">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-text-secondary">Escola ativa (aparece nas opções de cadastro)</span>
            </label>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
              loading={saveLoading}
            >
              {modal.school ? 'Salvar alterações' : 'Criar escola'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModal({ open: false, school: null })}
              disabled={saveLoading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar exclusão */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, school: null })}
        title="Excluir escola"
        size="sm"
      >
        <p className="text-sm text-text-secondary mb-2">
          Tem certeza que deseja excluir{' '}
          <strong className="text-text-primary">"{deleteModal.school?.name}"</strong>?
        </p>
        <p className="text-xs text-text-muted mb-5">
          Escolas vinculadas a usuários não podem ser excluídas — desative-as em vez disso.
        </p>
        {deleteError && (
          <div className="bg-error-light border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-4">
            {deleteError}
          </div>
        )}
        <div className="flex gap-3">
          <Button
            variant="primary"
            className="flex-1 bg-error hover:bg-error-text"
            onClick={handleDelete}
            loading={deleteLoading}
          >
            <Trash2 size={14} /> Excluir
          </Button>
          <Button
            variant="secondary"
            onClick={() => { setDeleteModal({ open: false, school: null }); setDeleteError('') }}
            disabled={deleteLoading}
          >
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default SchoolsManager
