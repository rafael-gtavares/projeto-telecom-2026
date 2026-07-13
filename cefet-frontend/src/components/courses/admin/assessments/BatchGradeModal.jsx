import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Modal from '../../../ui/Modal'
import Button from '../../../ui/Button'
import { Avatar, Badge } from '../../../ui/index'

// Lançamento de notas em lote: mostra todos os alunos e um campo de nota para
// cada um. Ao final, salva tudo de uma vez (rascunho ou publicando).
// `students` são os enrollments; `scores` são as notas atuais desta avaliação.
const BatchGradeModal = ({ open, assessment, students, scores, onClose, onSave, saving }) => {
  const [values, setValues] = useState({})

  // Mapa studentId → nota atual desta avaliação
  const initial = useMemo(() => {
    const map = {}
    for (const s of (scores || [])) {
      if (String(s.assessment) === String(assessment?._id)) {
        map[String(s.student)] = s.score
      }
    }
    return map
  }, [scores, assessment])

  useEffect(() => {
    if (!open) return
    const init = {}
    for (const e of (students || [])) {
      const id = e.user?._id
      init[id] = initial[id] != null ? String(initial[id]) : ''
    }
    setValues(init)
  }, [open, students, initial])

  if (!assessment) return null

  const max = assessment.maxScore
  // Limita a nota a no máximo 2 casas decimais.
  const setVal = (id, raw) => {
    let v = raw
    if (v.includes('.')) {
      const [int, dec] = v.split('.')
      v = `${int}.${dec.slice(0, 2)}`
    }
    setValues(prev => ({ ...prev, [id]: v }))
  }

  const build = () => (students || []).map(e => ({
    studentId: e.user?._id,
    score: values[e.user?._id] === '' ? '' : Number(values[e.user?._id]),
  }))

  const invalid = (students || []).some(e => {
    const v = values[e.user?._id]
    if (v === '' || v == null) return false
    const n = Number(v)
    return Number.isNaN(n) || n < 0 || n > max
  })

  return (
    <Modal open={open} onClose={onClose} title={`Lançar notas — ${assessment.title}`} size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-text-muted">
            Nota de <strong>0 a {max}</strong>. Deixe em branco para não lançar. {(students || []).length} aluno{(students || []).length !== 1 ? 's' : ''}.
          </p>
          {assessment.published
            ? <Badge variant="success" className="text-[10px]">Publicada</Badge>
            : <Badge variant="warning" className="text-[10px]">Rascunho</Badge>}
        </div>

        {(students || []).length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">Nenhum aluno inscrito ainda.</p>
        ) : (
          <div className="max-h-[45vh] overflow-y-auto space-y-2 pr-1">
            {students.map(e => {
              const id = e.user?._id
              const v = values[id] ?? ''
              const over = v !== '' && Number(v) > max
              return (
                <div key={id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-page">
                  <Avatar name={e.user?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{e.user?.name}</p>
                    <p className="text-xs text-text-muted truncate">{e.user?.email}</p>
                  </div>
                  <input
                    type="number" min="0" max={max} step="0.01"
                    value={v}
                    onChange={ev => setVal(id, ev.target.value)}
                    placeholder="—"
                    className={`input-field w-20 text-center py-1.5 ${over ? 'border-error text-error' : ''}`}
                  />
                  <span className="text-xs text-text-muted w-10">/ {max}</span>
                </div>
              )
            })}
          </div>
        )}

        {invalid && (
          <p className="text-xs text-error">Há notas fora do intervalo permitido (0 a {max}).</p>
        )}

        <div className="flex flex-wrap gap-3 pt-1 border-t border-border">
          <Button
            variant="primary"
            className="flex-1 gap-1.5"
            loading={saving}
            disabled={invalid}
            onClick={() => onSave(build(), true)}
          >
            <CheckCircle2 size={15} /> {assessment.published ? 'Salvar e manter publicada' : 'Salvar e publicar'}
          </Button>
          <Button
            variant="secondary"
            loading={saving}
            disabled={invalid}
            onClick={() => onSave(build(), false)}
          >
            Salvar rascunho
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default BatchGradeModal
