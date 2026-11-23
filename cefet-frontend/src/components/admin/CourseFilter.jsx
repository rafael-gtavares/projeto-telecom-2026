import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronDown, Search, X } from 'lucide-react'

// Busca sem diferenciar maiúsculas/minúsculas nem acentos
const normalize = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Filtro de cursos com busca embutida. `value` = id do curso ou 'all'.
// A pesquisa acontece só dentro da lista de opções (não toca na busca geral).
const CourseFilter = ({ courses = [], value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef(null)

  const selected = courses.find(c => c._id === value)
  const hasSelection = value !== 'all'

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return q ? courses.filter(c => normalize(c.title).includes(q)) : courses
  }, [courses, query])

  const choose = (id) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`input-field text-sm py-2.5 flex items-center gap-2 text-left ${hasSelection ? 'pr-16' : 'pr-9'}`}
      >
        <BookOpen size={15} className="text-text-muted flex-shrink-0" />
        <span className={`truncate flex-1 ${hasSelection ? 'text-text-primary' : 'text-text-muted'}`}>
          {selected?.title || 'Todos os cursos'}
        </span>
      </button>

      {hasSelection ? (
        <button
          type="button"
          onClick={() => choose('all')}
          title="Limpar filtro de curso"
          aria-label="Limpar filtro de curso"
          className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-page transition-colors"
        >
          <X size={14} />
        </button>
      ) : null}
      <ChevronDown
        size={15}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />

      {open && (
        <div className="absolute z-30 mt-1 left-0 right-0 sm:min-w-[18rem] sm:left-auto sm:right-0 bg-white border border-border rounded-btn shadow-modal overflow-hidden">
          <div className="relative p-2 border-b border-border">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar curso..."
              className="input-field pl-8 text-sm py-2 w-full"
            />
          </div>

          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!hasSelection}
                onClick={() => choose('all')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-page transition-colors ${!hasSelection ? 'font-semibold text-primary' : 'text-text-secondary'}`}
              >
                Todos os cursos
              </button>
            </li>

            {filtered.map(c => (
              <li key={c._id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c._id === value}
                  onClick={() => choose(c._id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-page transition-colors break-words ${c._id === value ? 'font-semibold text-primary' : 'text-text-primary'}`}
                >
                  {c.title}
                </button>
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-text-muted text-center">
                Nenhum curso encontrado.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CourseFilter