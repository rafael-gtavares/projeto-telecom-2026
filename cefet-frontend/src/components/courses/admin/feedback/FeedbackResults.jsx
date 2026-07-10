import { useState, useMemo } from 'react'
import { Users, BarChart3, Star, ListChecks, AlignLeft, User, MessageSquareText } from 'lucide-react'

const optLetter = (i) => String.fromCharCode(97 + i)

// Agrega as respostas por questão (para a visão "Geral")
const buildAggregates = (form, responses) => {
  if (!form) return []
  return form.questions.map((q) => {
    const answers = responses
      .map((r) => r.answers.find((a) => String(a.question) === String(q._id)))
      .filter(Boolean)

    if (q.type === 'multiple_choice') {
      const counts = q.options.map(() => 0)
      answers.forEach((a) => { if (counts[a.optionIndex] !== undefined) counts[a.optionIndex]++ })
      return { q, total: answers.length, counts }
    }
    if (q.type === 'stars') {
      const values = answers.map((a) => a.stars).filter((n) => typeof n === 'number')
      const avg = values.length ? values.reduce((s, n) => s + n, 0) / values.length : null
      const dist = Array.from({ length: q.maxStars + 1 }, (_, i) => values.filter((v) => v === i).length)
      return { q, total: values.length, avg, dist }
    }
    return { q, total: answers.length, texts: answers.map((a) => a.text) }
  })
}

const FeedbackResults = ({ form, responses, totalStudents }) => {
  const [mode, setMode] = useState('geral') // 'geral' | 'individual'
  const [selectedId, setSelectedId] = useState(responses[0]?._id || null)

  const aggregates = useMemo(() => buildAggregates(form, responses), [form, responses])
  const selected = responses.find((r) => r._id === selectedId) || responses[0]

  const rate = totalStudents > 0 ? Math.round((responses.length / totalStudents) * 100) : 0

  if (!form || form.questions.length === 0) {
    return (
      <div className="text-center py-14 text-text-muted">
        <BarChart3 size={36} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">Crie o formulário na aba "Formulário" para começar a receber respostas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo + alternador de modo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Users size={16} className="text-primary" />
          <span><strong className="text-text-primary">{responses.length}</strong> de {totalStudents} alunos responderam</span>
          <span className="text-xs text-text-muted">({rate}%)</span>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface-page self-start">
          {[
            { key: 'geral', label: 'Geral', icon: BarChart3 },
            { key: 'individual', label: 'Individual', icon: User },
          ].map((opt) => {
            const Icon = opt.icon
            return (
              <button key={opt.key} onClick={() => setMode(opt.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  mode === opt.key ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-primary'
                }`}>
                <Icon size={13} /> {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-14 text-text-muted">
          <MessageSquareText size={36} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum aluno respondeu ao feedback ainda.</p>
        </div>
      ) : mode === 'geral' ? (
        /* ── VISÃO GERAL (médias e estatísticas) ── */
        <div className="space-y-4">
          {aggregates.map(({ q, total, counts, avg, dist, texts }, qi) => (
            <div key={q._id || qi} className="card p-4">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xs font-bold text-text-muted mt-0.5">{qi + 1}.</span>
                <p className="text-sm font-semibold text-text-primary flex-1">{q.title}</p>
                <span className="text-[11px] text-text-muted flex-shrink-0">{total} resp.</span>
              </div>

              {q.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const c = counts[oi] || 0
                    const pct = total ? Math.round((c / total) * 100) : 0
                    return (
                      <div key={oi}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-text-secondary"><strong className="text-text-muted">{optLetter(oi)})</strong> {opt}</span>
                          <span className="text-text-muted flex-shrink-0 ml-2">{c} · {pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-page overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {q.type === 'stars' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={18} className="fill-warning text-warning" />
                    <span className="text-2xl font-bold text-text-primary">{avg != null ? avg.toFixed(1) : '—'}</span>
                    <span className="text-xs text-text-muted">média de 0 a {q.maxStars}</span>
                  </div>
                  <div className="space-y-1">
                    {dist.map((c, val) => {
                      const pct = total ? Math.round((c / total) * 100) : 0
                      return (
                        <div key={val} className="flex items-center gap-2">
                          <span className="text-[11px] text-text-muted w-8 text-right tabular-nums">{val} ★</span>
                          <div className="flex-1 h-2 rounded-full bg-surface-page overflow-hidden">
                            <div className="h-full bg-warning rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] text-text-muted w-6 tabular-nums">{c}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {q.type === 'text' && (
                total === 0 ? (
                  <p className="text-xs text-text-muted italic">Sem respostas.</p>
                ) : (
                  <div className="space-y-2">
                    {texts.map((t, ti) => (
                      <p key={ti} className="text-sm text-text-secondary bg-surface-page rounded-lg px-3 py-2 leading-relaxed">“{t}”</p>
                    ))}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── VISÃO INDIVIDUAL ── */
        <div className="grid md:grid-cols-[220px_1fr] gap-4">
          {/* Lista de respondentes */}
          <div className="space-y-1.5 md:max-h-[520px] md:overflow-y-auto">
            {responses.map((r) => (
              <button key={r._id} onClick={() => setSelectedId(r._id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                  selected?._id === r._id ? 'border-primary bg-surface-blue' : 'border-border hover:border-primary/40'
                }`}>
                <p className="text-sm font-medium text-text-primary truncate">{r.user?.name || 'Aluno'}</p>
                <p className="text-[11px] text-text-muted truncate">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</p>
              </button>
            ))}
          </div>

          {/* Respostas do selecionado */}
          <div className="card p-4">
            {selected && (
              <>
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center">
                    <User size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{selected.user?.name || 'Aluno'}</p>
                    <p className="text-[11px] text-text-muted truncate">{selected.user?.email}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {form.questions.map((q, qi) => {
                    const a = selected.answers.find((x) => String(x.question) === String(q._id))
                    return (
                      <div key={q._id || qi}>
                        <p className="text-xs font-semibold text-text-primary mb-1 inline-flex items-center gap-1">
                          {q.type === 'multiple_choice' && <ListChecks size={12} className="text-text-muted" />}
                          {q.type === 'stars' && <Star size={12} className="text-text-muted" />}
                          {q.type === 'text' && <AlignLeft size={12} className="text-text-muted" />}
                          {qi + 1}. {q.title}
                        </p>
                        {!a ? (
                          <p className="text-xs text-text-muted italic pl-4">Não respondeu.</p>
                        ) : q.type === 'multiple_choice' ? (
                          <p className="text-sm text-text-secondary pl-4"><strong className="text-text-muted">{optLetter(a.optionIndex)})</strong> {a.optionText}</p>
                        ) : q.type === 'stars' ? (
                          <p className="text-sm text-text-secondary pl-4 inline-flex items-center gap-1">
                            <Star size={14} className="fill-warning text-warning" /> {a.stars} / {q.maxStars}
                          </p>
                        ) : (
                          <p className="text-sm text-text-secondary pl-4 bg-surface-page rounded-lg px-3 py-2 leading-relaxed">“{a.text}”</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedbackResults
