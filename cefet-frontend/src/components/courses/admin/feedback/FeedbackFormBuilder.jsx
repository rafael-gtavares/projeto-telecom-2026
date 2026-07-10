import { useState } from 'react'
import { Plus, Trash2, Edit2, ListChecks, Star, AlignLeft, ClipboardList } from 'lucide-react'
import Button from '../../../ui/Button'

const MAX_OPTIONS = 8

// Metadados de cada tipo de questão (rótulo + ícone)
export const QUESTION_TYPES = {
  multiple_choice: { label: 'Múltipla escolha', icon: ListChecks },
  stars: { label: 'Estrelas (nota)', icon: Star },
  text: { label: 'Texto aberto', icon: AlignLeft },
}

const blankDraft = (type = 'multiple_choice') => ({
  type,
  title: '',
  options: type === 'multiple_choice' ? ['', ''] : [],
  maxStars: 5,
})

// Construtor do formulário de feedback: lista (esquerda) + criação/edição (direita).
// value: array de { _key, _id?, type, title, options?, maxStars? }
const FeedbackFormBuilder = ({ value, onChange }) => {
  const [form, setForm] = useState(null) // null | { index: number|null, draft }

  const startCreate = () => setForm({ index: null, draft: blankDraft() })
  const startEdit = (i) => setForm({
    index: i,
    draft: {
      type: value[i].type,
      title: value[i].title,
      options: value[i].options?.length ? [...value[i].options] : ['', ''],
      maxStars: value[i].maxStars || 5,
    },
  })
  const cancel = () => setForm(null)

  const removeQuestion = (i) => {
    onChange(value.filter((_, idx) => idx !== i))
    if (form && form.index === i) setForm(null)
  }

  const setDraft = (patch) => setForm((f) => ({ ...f, draft: { ...f.draft, ...patch } }))
  const changeType = (type) => setDraft({
    type,
    options: type === 'multiple_choice' ? (form.draft.options?.length ? form.draft.options : ['', '']) : form.draft.options,
  })
  const setOption = (oi, text) => setDraft({ options: form.draft.options.map((o, i) => (i === oi ? text : o)) })
  const addOption = () => { if (form.draft.options.length < MAX_OPTIONS) setDraft({ options: [...form.draft.options, ''] }) }
  const removeOption = (oi) => {
    if (form.draft.options.length <= 2) return
    setDraft({ options: form.draft.options.filter((_, i) => i !== oi) })
  }

  const d = form?.draft
  const draftValid = !!d && d.title.trim() && (
    d.type !== 'multiple_choice' || (d.options.length >= 2 && d.options.every((o) => o.trim()))
  ) && (d.type !== 'stars' || (d.maxStars >= 1 && d.maxStars <= 10))

  const saveQuestion = () => {
    if (!draftValid) return
    const clean = { type: d.type, title: d.title.trim() }
    if (d.type === 'multiple_choice') clean.options = d.options.map((o) => o.trim())
    if (d.type === 'stars') clean.maxStars = Number(d.maxStars)

    if (form.index === null) {
      onChange([...value, { _key: crypto.randomUUID(), ...clean }])
    } else {
      onChange(value.map((q, i) => (i === form.index ? { ...q, ...clean } : q)))
    }
    setForm(null)
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 md:min-h-[420px]">
      {/* ── LISTA ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-text-primary">Questões ({value.length})</h4>
          <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={startCreate}>
            <Plus size={14} /> Nova questão
          </Button>
        </div>

        {value.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <ClipboardList size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma questão ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {value.map((q, i) => {
              const meta = QUESTION_TYPES[q.type] || QUESTION_TYPES.text
              const Icon = meta.icon
              return (
                <div key={q._key} className={`card p-3 ${form?.index === i ? 'border-primary ring-1 ring-primary' : ''}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-text-muted mt-0.5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary line-clamp-2">{q.title || '(sem enunciado)'}</p>
                      <p className="text-[11px] text-text-muted mt-1 inline-flex items-center gap-1">
                        <Icon size={11} /> {meta.label}
                        {q.type === 'multiple_choice' && ` · ${q.options.length} alternativas`}
                        {q.type === 'stars' && ` · 0–${q.maxStars}`}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(i)} title="Editar questão"
                        className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => removeQuestion(i)} title="Excluir questão"
                        className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── CRIAÇÃO / EDIÇÃO ── */}
      <div className="md:border-l md:border-border md:pl-4">
        {!form ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-text-muted">
            <ClipboardList size={28} className="mb-2 opacity-50" />
            <p className="text-sm">Crie uma nova questão ou<br />selecione uma para editar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-text-primary">
              {form.index === null ? 'Criar questão' : `Editar questão ${form.index + 1}`}
            </h4>

            {/* Tipo */}
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(QUESTION_TYPES).map(([key, meta]) => {
                const Icon = meta.icon
                const active = d.type === key
                return (
                  <button key={key} onClick={() => changeType(key)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[11px] font-medium transition-colors ${
                      active ? 'border-primary bg-surface-blue text-primary' : 'border-border text-text-muted hover:border-primary/40'
                    }`}>
                    <Icon size={15} /> {meta.label}
                  </button>
                )
              })}
            </div>

            <textarea
              value={d.title}
              onChange={(e) => setDraft({ title: e.target.value })}
              rows={2}
              maxLength={300}
              placeholder="Enunciado da pergunta..."
              className="input-field w-full resize-none text-sm"
            />

            {/* Config por tipo */}
            {d.type === 'multiple_choice' && (
              <div className="space-y-2">
                <p className="text-xs text-text-muted">Alternativas — máx. {MAX_OPTIONS}</p>
                {d.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-muted w-4">{String.fromCharCode(97 + oi)})</span>
                    <input
                      value={opt}
                      onChange={(e) => setOption(oi, e.target.value)}
                      maxLength={200}
                      placeholder={`Alternativa ${String.fromCharCode(97 + oi)}`}
                      className="input-field flex-1 text-sm py-2"
                    />
                    <button onClick={() => removeOption(oi)} disabled={d.options.length <= 2}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remover alternativa">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {d.options.length < MAX_OPTIONS && (
                  <button onClick={addOption} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                    <Plus size={13} /> Adicionar alternativa
                  </button>
                )}
              </div>
            )}

            {d.type === 'stars' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">Nota máxima (estrelas):</label>
                <input
                  type="number" min={1} max={10}
                  value={d.maxStars}
                  onChange={(e) => setDraft({ maxStars: Number(e.target.value) })}
                  className="input-field w-20 text-sm py-2"
                />
                <span className="text-xs text-text-muted">de 0 a {d.maxStars || '?'}</span>
              </div>
            )}

            {d.type === 'text' && (
              <p className="text-xs text-text-muted italic">O aluno responderá em um campo de texto livre.</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="primary" className="flex-1 text-sm py-2" onClick={saveQuestion} disabled={!draftValid}>
                Salvar questão
              </Button>
              <Button variant="secondary" className="text-sm py-2" onClick={cancel}>Cancelar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackFormBuilder
