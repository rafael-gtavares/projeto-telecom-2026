import { useEffect, useState } from 'react'
import { MailPlus } from 'lucide-react'
import { Spinner } from '../ui/index'
import { getWaitlistSourcesAPI, getCourseWaitlistAPI } from '../../api/invitations'
import { formatDateShort } from '../../utils/formatDate'
import { getInviteDeadline, formatDeadline } from '../../utils/invitations'

const STATUS_LABELS = {
  draft: 'rascunho',
  published: 'publicado',
  vagas_encerradas: 'vagas encerradas',
  em_andamento: 'em andamento',
  closed: 'encerrado',
}

// Bloco do formulário de curso: convidar quem ficou na fila de espera de outro
// curso (normalmente uma edição anterior). Cada convite reserva uma vaga até o
// prazo, que não pode passar do início do curso.
//
// Props:
//  - value / onChange: { enabled, sourceCourseId, studentIds, days }
//                      (onChange precisa aceitar a forma funcional, como um setState)
//  - courseId:         curso em edição (null na criação)
//  - prerequisiteIds:  pré-requisitos do formulário (só usados na criação)
//  - maxDays:          maior prazo permitido (null = cronograma ainda sem data)
//  - freeSlots:        vagas livres para convites
//  - error:            mensagem de validação (getInviteError)
const WaitlistInvitePicker = ({
  value, onChange, courseId, prerequisiteIds = [], maxDays, freeSlots, error,
}) => {
  const [sources, setSources] = useState([])
  const [loadingSources, setLoadingSources] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  const update = (patch) => onChange({ ...value, ...patch })
  const prereqKey = prerequisiteIds.join(',')

  // Carrega os cursos de origem ao ativar a opção
  useEffect(() => {
    if (!value.enabled) return
    setLoadingSources(true)
    getWaitlistSourcesAPI(courseId)
      .then(({ data }) => setSources(data.data))
      .catch(() => setSources([]))
      .finally(() => setLoadingSources(false))
  }, [value.enabled, courseId])

  // Carrega a fila do curso escolhido e pré-seleciona os primeiros elegíveis,
  // na ordem de chegada, até o limite de vagas livres
  useEffect(() => {
    if (!value.enabled || !value.sourceCourseId) {
      setCandidates([])
      return
    }
    let cancelled = false
    setLoadingCandidates(true)
    getCourseWaitlistAPI(value.sourceCourseId, {
      target: courseId,
      prerequisites: courseId ? undefined : prerequisiteIds,
    })
      .then(({ data }) => {
        if (cancelled) return
        setCandidates(data.data)
        const eligible = data.data.filter((c) => c.eligible).map((c) => c.studentId)
        // Forma funcional: não sobrescreve o prazo digitado enquanto a fila carregava
        onChange((prev) => ({ ...prev, studentIds: eligible.slice(0, Math.max(0, freeSlots)) }))
      })
      .catch(() => { if (!cancelled) setCandidates([]) })
      .finally(() => { if (!cancelled) setLoadingCandidates(false) })
    return () => { cancelled = true }
    // Recarrega só quando muda a origem, o curso ou os pré-requisitos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.enabled, value.sourceCourseId, courseId, prereqKey])

  const toggleStudent = (id) => {
    const selected = value.studentIds.includes(id)
    update({ studentIds: selected ? value.studentIds.filter((s) => s !== id) : [...value.studentIds, id] })
  }

  const eligibleIds = candidates.filter((c) => c.eligible).map((c) => c.studentId)
  const allSelected = eligibleIds.length > 0 && eligibleIds.every((id) => value.studentIds.includes(id))
  const days = Number(value.days)
  const showDeadline = Number.isInteger(days) && days >= 1 && maxDays != null && days <= maxDays

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <span>
          <span className="block text-sm font-medium text-text-primary">
            Convidar pessoas da fila de espera de outro curso
          </span>
          <span className="block text-xs text-text-muted">
            Cada convidado tem uma vaga reservada até o fim do prazo, mesmo antes de aceitar.
            Se não aceitar a tempo, a vaga é liberada.
          </span>
        </span>
      </label>

      {value.enabled && (
        <div className="space-y-4 p-4 rounded-lg border border-border bg-surface-hover/50">
          {/* Curso de origem */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Curso de origem</label>
            {loadingSources ? (
              <div className="py-2"><Spinner size="sm" /></div>
            ) : sources.length === 0 ? (
              <p className="text-xs text-text-muted">
                Nenhum curso que você gerencia tem pessoas na fila de espera.
              </p>
            ) : (
              <select
                value={value.sourceCourseId}
                onChange={(e) => update({ sourceCourseId: e.target.value, studentIds: [] })}
                className="input-field w-full"
              >
                <option value="">Selecione um curso…</option>
                {sources.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title} — {formatDateShort(s.startDate)} ({STATUS_LABELS[s.status] || s.status}) · {s.waitlistCount} na fila
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Pessoas da fila */}
          {value.sourceCourseId && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-sm font-medium text-text-secondary">
                  Fila de espera (ordem de chegada)
                </span>
                {eligibleIds.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-primary font-medium hover:underline"
                    onClick={() => update({ studentIds: allSelected ? [] : eligibleIds })}
                  >
                    {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                  </button>
                )}
              </div>

              {loadingCandidates ? (
                <div className="py-2"><Spinner size="sm" /></div>
              ) : candidates.length === 0 ? (
                <p className="text-xs text-text-muted">Ninguém na fila de espera deste curso.</p>
              ) : (
                <ul className="max-h-56 overflow-y-auto divide-y divide-border border border-border rounded-lg bg-surface">
                  {candidates.map((c) => (
                    <li key={c.studentId}>
                      <label
                        className={`flex items-center gap-3 px-3 py-2 ${c.eligible ? 'cursor-pointer hover:bg-surface-hover' : 'opacity-60'}`}
                      >
                        <input
                          type="checkbox"
                          disabled={!c.eligible}
                          checked={value.studentIds.includes(c.studentId)}
                          onChange={() => toggleStudent(c.studentId)}
                          className="h-4 w-4 accent-primary flex-shrink-0"
                        />
                        <span className="text-xs text-text-muted w-6 flex-shrink-0">{c.position}º</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-text-primary truncate">{c.name}</span>
                          <span className="block text-xs text-text-muted truncate">
                            {c.eligible ? c.email : c.reason}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <p className={`text-xs mt-1.5 ${value.studentIds.length > freeSlots ? 'text-error-text' : 'text-text-muted'}`}>
                {value.studentIds.length} selecionado(s) de {Math.max(0, freeSlots)} vaga(s) livre(s)
              </p>
            </div>
          )}

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Prazo para aceitar (em dias)
            </label>
            <input
              type="number"
              min="1"
              max={maxDays || undefined}
              step="1"
              value={value.days}
              onChange={(e) => update({ days: e.target.value })}
              className="input-field w-full sm:w-40"
              placeholder="Ex.: 3"
              disabled={maxDays != null && maxDays < 1}
            />
            <p className="text-xs text-text-muted mt-1.5">
              {maxDays == null
                ? 'Defina o cronograma para calcular o prazo máximo.'
                : maxDays < 1
                  ? 'O curso começa em menos de 1 dia, então não há prazo possível.'
                  : <>Máximo de {maxDays} dia(s), para não ultrapassar o início do curso.
                    {showDeadline && <> O convite vence em <strong>{formatDeadline(getInviteDeadline(days))}</strong>.</>}</>}
            </p>
          </div>

          {error && (
            <p className="flex items-start gap-2 text-xs text-warning-text">
              <MailPlus size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default WaitlistInvitePicker
