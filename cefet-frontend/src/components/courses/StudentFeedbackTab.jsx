import { useState, useEffect } from 'react'
import { Star, Send, CheckCircle, Clock, MessageSquareText, Pencil, X } from 'lucide-react'
import Button from '../ui/Button'
import Toast from '../ui/Toast'
import { Spinner } from '../ui/index'
import { getStudentFeedbackAPI, submitFeedbackResponseAPI, updateFeedbackResponseAPI } from '../../api/feedback'

const TEXT_MAX = 1000                       // limite do campo de texto (bate com o backend)
const EDIT_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 1 edição por dia

// Seletor de estrelas (0 a max). Clicar numa estrela define a nota; "zerar" volta a 0.
const StarPicker = ({ max, value, onChange }) => (
  <div className="flex items-center gap-1 flex-wrap">
    {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)} title={`${n}`}>
        <Star size={22} className={value != null && n <= value ? 'fill-warning text-warning' : 'text-border hover:text-warning/50'} />
      </button>
    ))}
    <span className="text-sm font-semibold text-text-primary ml-2 tabular-nums">
      {value != null ? `${value}/${max}` : '—'}
    </span>
    {value != null && value > 0 && (
      <button type="button" onClick={() => onChange(0)} className="text-xs text-text-muted hover:text-error ml-1">zerar</button>
    )}
  </div>
)

// Constrói o estado de respostas a partir de uma resposta já enviada (para editar)
const answersFromResponse = (resp) => {
  const map = {}
  for (const a of resp.answers || []) {
    if (a.type === 'multiple_choice') map[a.question] = a.optionIndex
    else if (a.type === 'stars') map[a.question] = a.stars
    else if (a.type === 'text') map[a.question] = a.text
  }
  return map
}

const canEditNow = (resp) =>
  !resp?.lastEditedAt || (Date.now() - new Date(resp.lastEditedAt).getTime()) >= EDIT_COOLDOWN_MS

const nextEditDate = (resp) =>
  new Date(new Date(resp.lastEditedAt).getTime() + EDIT_COOLDOWN_MS)

// Aba "Feedback" do aluno — só faz sentido com o curso concluído (closed).
const StudentFeedbackTab = ({ courseId }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ available: false, form: null, myResponse: null })
  const [answers, setAnswers] = useState({}) // questionId -> value
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    let active = true
    setLoading(true)
    getStudentFeedbackAPI(courseId)
      .then(({ data }) => { if (active) setData(data.data) })
      .catch(() => { if (active) setToast({ show: true, message: 'Erro ao carregar o feedback.' }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId])

  const setAnswer = (qid, value) => setAnswers((prev) => ({ ...prev, [qid]: value }))

  const startEdit = () => {
    setAnswers(answersFromResponse(data.myResponse))
    setEditing(true)
  }
  const cancelEdit = () => { setEditing(false); setAnswers({}) }

  const handleSave = async () => {
    const form = data.form
    const payload = form.questions
      .map((q) => {
        const v = answers[q._id]
        if (q.type === 'multiple_choice') return v != null ? { question: q._id, optionIndex: v } : null
        if (q.type === 'stars') return v != null ? { question: q._id, stars: v } : null
        if (q.type === 'text') return v && v.trim() ? { question: q._id, text: v.trim().slice(0, TEXT_MAX) } : null
        return null
      })
      .filter(Boolean)

    if (payload.length === 0) {
      setToast({ show: true, message: 'Responda ao menos uma questão.' })
      return
    }

    setSubmitting(true)
    try {
      const call = editing ? updateFeedbackResponseAPI : submitFeedbackResponseAPI
      const { data: res } = await call(courseId, payload)
      setData((prev) => ({ ...prev, myResponse: res.data }))
      setEditing(false)
      setAnswers({})
      setToast({ show: true, message: editing ? 'Feedback atualizado. 🎉' : 'Feedback enviado. Obrigado! 🎉' })
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || 'Erro ao enviar o feedback.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  // Já respondeu e não está editando → agradecimento + resumo + botão de editar
  if (data.myResponse && !editing) {
    const editable = canEditNow(data.myResponse) && !!data.form
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={26} className="text-success" />
          </div>
          <p className="font-semibold text-text-primary">Feedback enviado</p>
          <p className="text-sm text-text-secondary mt-1">Obrigado por avaliar o curso!</p>
        </div>

        <div className="space-y-2">
          {data.myResponse.answers.map((a, i) => (
            <div key={i} className="card p-3">
              <p className="text-xs font-semibold text-text-primary mb-1">{a.questionTitle}</p>
              {a.type === 'multiple_choice' && <p className="text-sm text-text-secondary">{a.optionText}</p>}
              {a.type === 'stars' && (
                <p className="text-sm text-text-secondary inline-flex items-center gap-1">
                  <Star size={14} className="fill-warning text-warning" /> {a.stars}
                </p>
              )}
              {a.type === 'text' && <p className="text-sm text-text-secondary whitespace-pre-wrap">“{a.text}”</p>}
            </div>
          ))}
        </div>

        {/* Edição: 1 vez por dia */}
        <div className="flex flex-col items-center gap-1.5 pt-2">
          {editable ? (
            <Button variant="secondary" onClick={startEdit}>
              <Pencil size={15} /> Editar feedback
            </Button>
          ) : data.form ? (
            <p className="text-xs text-text-muted text-center">
              Você já editou hoje. Poderá editar novamente a partir de{' '}
              <strong className="text-text-secondary">
                {nextEditDate(data.myResponse).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </strong>.
            </p>
          ) : null}
          <p className="text-[11px] text-text-muted">O feedback pode ser editado 1 vez por dia.</p>
        </div>

        <Toast show={toast.show} message={toast.message} onClose={() => setToast({ show: false, message: '' })} />
      </div>
    )
  }

  // Feedback ainda não disponível (curso não concluído ou sem formulário publicado)
  if (!data.available || !data.form) {
    return (
      <div className="text-center py-14">
        <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
          <Clock size={26} className="text-warning" />
        </div>
        <p className="font-semibold text-text-primary mb-1">Feedback indisponível</p>
        <p className="text-sm text-text-muted max-w-sm mx-auto">
          O formulário de avaliação deste curso ainda não está disponível.
        </p>
      </div>
    )
  }

  // Formulário para responder (novo) ou editar
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center">
            <MessageSquareText size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary leading-tight">{editing ? 'Editar feedback' : 'Avalie o curso'}</h3>
            <p className="text-xs text-text-muted">
              {editing ? 'Você pode editar 1 vez por dia.' : 'Sua opinião nos ajuda a melhorar. É opcional.'}
            </p>
          </div>
        </div>
        {editing && (
          <button onClick={cancelEdit} className="text-text-muted hover:text-error p-1.5" title="Cancelar edição">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {data.form.questions.map((q, qi) => (
          <div key={q._id} className="card p-4">
            <p className="text-sm font-semibold text-text-primary mb-3">
              <span className="text-text-muted">{qi + 1}.</span> {q.title}
            </p>

            {q.type === 'multiple_choice' && (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${q._id}`}
                      checked={answers[q._id] === oi}
                      onChange={() => setAnswer(q._id, oi)}
                      className="w-4 h-4 accent-primary flex-shrink-0"
                    />
                    <span className="text-sm text-text-secondary">
                      <strong className="text-text-muted">{String.fromCharCode(97 + oi)})</strong> {opt}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'stars' && (
              <StarPicker max={q.maxStars} value={answers[q._id] ?? null} onChange={(v) => setAnswer(q._id, v)} />
            )}

            {q.type === 'text' && (
              <div>
                <textarea
                  value={answers[q._id] || ''}
                  onChange={(e) => setAnswer(q._id, e.target.value.slice(0, TEXT_MAX))}
                  rows={3}
                  maxLength={TEXT_MAX}
                  placeholder="Escreva sua resposta..."
                  className="input-field w-full resize-none text-sm"
                />
                <p className="text-[11px] text-text-muted text-right mt-1 tabular-nums">
                  {(answers[q._id] || '').length}/{TEXT_MAX}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {editing && (
          <Button variant="secondary" onClick={cancelEdit} disabled={submitting}>Cancelar</Button>
        )}
        <Button variant="primary" onClick={handleSave} loading={submitting}>
          <Send size={15} /> {editing ? 'Salvar alterações' : 'Enviar feedback'}
        </Button>
      </div>

      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ show: false, message: '' })} />
    </div>
  )
}

export default StudentFeedbackTab
