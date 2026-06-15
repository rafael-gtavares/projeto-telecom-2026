import { useState } from 'react'
import { Plus, Trash2, Edit2, FileQuestion } from 'lucide-react'
import Button from '../ui/Button'

const MAX_OPTIONS = 8

// Cria uma questão em branco com chave estável para o React
export const blankQuestion = () => ({
  _key: crypto.randomUUID(),
  question: '',
  options: ['', ''],
  correctIndex: 0,
})

// Construtor de questões com tela dividida: lista (esquerda) + criação/edição (direita).
// A lista não edita inline — é preciso entrar em "Editar questão".
// value: array de { _key, question, options: string[], correctIndex }
const ExerciseBuilder = ({ value, onChange }) => {
  // form: null (só lista) | { index: number|null, draft }
  const [form, setForm] = useState(null)

  const startCreate = () =>
    setForm({ index: null, draft: { question: '', options: ['', ''], correctIndex: 0 } })

  const startEdit = (i) =>
    setForm({
      index: i,
      draft: {
        question: value[i].question,
        options: [...value[i].options],
        correctIndex: value[i].correctIndex,
      },
    })

  const cancel = () => setForm(null)

  const removeQuestion = (i) => {
    onChange(value.filter((_, idx) => idx !== i))
    if (form && form.index === i) setForm(null)
  }

  const setDraft = (patch) => setForm((f) => ({ ...f, draft: { ...f.draft, ...patch } }))
  const setOption = (oi, text) => setDraft({ options: form.draft.options.map((o, i) => (i === oi ? text : o)) })
  const addOption = () => {
    if (form.draft.options.length < MAX_OPTIONS) setDraft({ options: [...form.draft.options, ''] })
  }
  const removeOption = (oi) => {
    const opts = form.draft.options
    if (opts.length <= 2) return
    const options = opts.filter((_, i) => i !== oi)
    let correctIndex = form.draft.correctIndex
    if (oi === correctIndex) correctIndex = 0
    else if (oi < correctIndex) correctIndex -= 1
    setDraft({ options, correctIndex })
  }

  const d = form?.draft
  const draftValid =
    !!d && d.question.trim() && d.options.length >= 2 && d.options.every((o) => o.trim())

  const saveQuestion = () => {
    if (!draftValid) return
    const clean = {
      question: d.question.trim(),
      options: d.options.map((o) => o.trim()),
      correctIndex: d.correctIndex,
    }
    if (form.index === null) {
      onChange([...value, { _key: crypto.randomUUID(), ...clean }])
    } else {
      onChange(value.map((q, i) => (i === form.index ? { ...q, ...clean } : q)))
    }
    setForm(null)
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 md:min-h-[380px]">
      {/* ── LISTA DE QUESTÕES ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-text-primary">Questões ({value.length})</h4>
          <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={startCreate}>
            <Plus size={14} /> Nova questão
          </Button>
        </div>

        {value.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">Nenhuma questão ainda.</p>
        ) : (
          <div className="space-y-2">
            {value.map((q, i) => (
              <div
                key={q._key}
                className={`card p-3 ${form?.index === i ? 'border-primary ring-1 ring-primary' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-text-muted mt-0.5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary line-clamp-2">{q.question || '(sem enunciado)'}</p>
                    <p className="text-[11px] text-text-muted mt-1">
                      {q.options.length} alternativas · correta: {String.fromCharCode(65 + q.correctIndex)}
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
            ))}
          </div>
        )}
      </div>

      {/* ── CRIAÇÃO / EDIÇÃO ── */}
      <div className="md:border-l md:border-border md:pl-4">
        {!form ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-text-muted">
            <FileQuestion size={28} className="mb-2 opacity-50" />
            <p className="text-sm">Crie uma nova questão ou<br />selecione uma para editar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-text-primary">
              {form.index === null ? 'Criar questão' : `Editar questão ${form.index + 1}`}
            </h4>

            <textarea
              value={d.question}
              onChange={(e) => setDraft({ question: e.target.value })}
              rows={3}
              placeholder="Enunciado da questão..."
              className="input-field w-full resize-none text-sm"
            />

            <div className="space-y-2">
              <p className="text-xs text-text-muted">Alternativas (marque a correta) — máx. {MAX_OPTIONS}</p>
              {d.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-draft"
                    checked={d.correctIndex === oi}
                    onChange={() => setDraft({ correctIndex: oi })}
                    className="w-4 h-4 accent-primary flex-shrink-0 cursor-pointer"
                    title="Marcar como correta"
                  />
                  <span className="text-xs font-bold text-text-muted w-4">{String.fromCharCode(65 + oi)}</span>
                  <input
                    value={opt}
                    onChange={(e) => setOption(oi, e.target.value)}
                    placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`}
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

export default ExerciseBuilder
