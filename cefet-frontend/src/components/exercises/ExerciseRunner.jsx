import { useState } from 'react'
import { CheckCircle, XCircle, RotateCcw, ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react'

// Quiz do aluno: uma questão por vez. No fim, mostra o resultado (acertos/erros)
// com revisão, e as opções de refazer ou voltar ao conteúdo. Nada é salvo.
const ExerciseRunner = ({ questions, onExit }) => {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({}) // índice da questão -> índice da alternativa
  const [finished, setFinished] = useState(false)

  const total = questions.length
  const correct = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0)
  const wrong = total - correct
  const answeredCount = Object.keys(answers).length

  const restart = () => { setStep(0); setAnswers({}); setFinished(false) }

  // ── Tela de resultado ──
  if (finished) {
    return (
      <div className="space-y-5">
        <div className="card p-6 bg-surface-blue border-primary/20 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Resultado</p>
          <p className="text-4xl font-bold text-primary my-1">{correct} / {total}</p>
          <div className="flex items-center justify-center gap-4 text-sm mt-1">
            <span className="inline-flex items-center gap-1 text-success font-medium">
              <CheckCircle size={15} /> {correct} acerto{correct !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-error font-medium">
              <XCircle size={15} /> {wrong} erro{wrong !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Revisão */}
        <div className="space-y-2">
          {questions.map((q, i) => {
            const ok = answers[i] === q.correctIndex
            return (
              <div key={i} className="card p-4">
                <div className="flex items-start gap-2">
                  {ok
                    ? <CheckCircle size={16} className="text-success mt-0.5 flex-shrink-0" />
                    : <XCircle size={16} className="text-error mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{i + 1}. {q.question}</p>
                    <p className="text-xs mt-1 text-text-muted">
                      Sua resposta:{' '}
                      <span className={ok ? 'text-success font-medium' : 'text-error font-medium'}>
                        {q.options[answers[i]]}
                      </span>
                    </p>
                    {!ok && (
                      <p className="text-xs text-success">Correta: {q.options[q.correctIndex]}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={restart} className="btn-primary flex-1"><RotateCcw size={16} /> Refazer</button>
          <button onClick={onExit} className="btn-secondary flex-1"><ArrowLeft size={16} /> Voltar ao conteúdo</button>
        </div>
      </div>
    )
  }

  // ── Quiz (uma questão por vez) ──
  const q = questions[step]
  const answered = answers[step] !== undefined

  return (
    <div className="space-y-5">
      {/* Progresso */}
      <div>
        <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
          <span>Questão {step + 1} de {total}</span>
          <span>{answeredCount}/{total} respondidas</span>
        </div>
        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <p className="font-semibold text-text-primary">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt, oi) => {
            const selected = answers[step] === oi
            return (
              <button
                key={oi}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [step]: oi }))}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  selected ? 'border-primary bg-surface-blue' : 'border-border hover:border-primary/40'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  selected ? 'bg-primary text-white' : 'bg-surface-hover text-text-muted'
                }`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="flex-1 text-text-primary">{opt}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setStep((s) => s - 1)} disabled={step === 0}
          className="btn-secondary text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft size={16} /> Anterior
        </button>
        {step < total - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!answered}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed">
            Próxima <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={() => setFinished(true)} disabled={!answered}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed">
            Ver resultado
          </button>
        )}
      </div>

      <button onClick={onExit} className="text-xs text-text-muted hover:text-text-primary w-full text-center">
        Voltar ao conteúdo
      </button>
    </div>
  )
}

export default ExerciseRunner
