import { useState, useEffect, useMemo } from 'react'
import { Search, X, Check } from 'lucide-react'
import Input from '../ui/Input'
import { Spinner } from '../ui/index'
import { getPrerequisiteOptionsAPI } from '../../api/courses'

// Remove acentos e caixa para a busca por nome
const normalize = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Seleção múltipla de cursos pré-requisito.
 * value: [{ _id, title }]  |  onChange(novoArray)  |  excludeId: curso em edição
 */
const PrerequisitesPicker = ({ value, onChange, excludeId }) => {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getPrerequisiteOptionsAPI(excludeId)
      .then(({ data }) => active && setOptions(data.data || []))
      .catch(() => active && setError('Não foi possível carregar a lista de cursos.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [excludeId])

  const selectedIds = useMemo(() => new Set(value.map((c) => c._id)), [value])

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    return q ? options.filter((o) => normalize(o.title).includes(q)) : options
  }, [options, search])

  const toggle = (course) => {
    if (selectedIds.has(course._id)) {
      onChange(value.filter((c) => c._id !== course._id))
    } else {
      onChange([...value, { _id: course._id, title: course.title }])
    }
  }

  return (
    <div className="space-y-3">
      {/* Selecionados */}
      <div>
        <p className="text-xs font-medium text-text-secondary mb-1.5">
          Selecionados ({value.length})
        </p>
        {value.length === 0 ? (
          <p className="text-xs text-text-muted">Nenhum curso selecionado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((c) => (
              <span
                key={c._id}
                className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {c.title}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x._id !== c._id))}
                  aria-label={`Remover ${c.title}`}
                  className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Busca + lista */}
      <Input
        icon={Search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar curso pelo nome..."
      />

      <div className="max-h-48 overflow-y-auto rounded-btn border border-border divide-y divide-border bg-white">
        {loading ? (
          <div className="flex justify-center py-6"><Spinner size="sm" /></div>
        ) : error ? (
          <p className="text-xs text-error p-3">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-text-muted p-3">Nenhum curso encontrado.</p>
        ) : (
          filtered.map((c) => {
            const checked = selectedIds.has(c._id)
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => toggle(c)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${checked ? 'bg-primary/5' : 'hover:bg-surface-hover'}`}
              >
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${checked ? 'bg-primary border-primary text-white' : 'border-border'}`}
                >
                  {checked && <Check size={12} />}
                </span>
                <span className="text-text-primary truncate">{c.title}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export default PrerequisitesPicker