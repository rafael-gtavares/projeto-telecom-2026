import { useEffect, useState } from 'react'
import { Spinner, Badge } from '../ui/index'
import { getMyAssessmentsAPI } from '../../api/assessments'
import { GRADING_METHODS, METHOD_LABELS, passingLabel } from '../../constants/gradingMethods'
import { SITUATIONS, SITUATION_LABELS } from '../../constants/enrollmentSitutation'

const TYPE_LABELS = { prova: 'Prova', trabalho: 'Trabalho', participacao: 'Participação', outro: 'Outro' }

const situationBadgeVariant = (s) =>
  s === SITUATIONS.APROVADO ? 'success'
    : s === SITUATIONS.REPROVADO ? 'error'
      : s === SITUATIONS.DESISTENTE ? 'warning'
        : 'gray'

// Aba "Avaliações" do aluno: método de cálculo, média para aprovação, status,
// nota final e a lista de todas as avaliações do curso (com nota quando publicada).
const StudentAssessmentsTab = ({ courseId, reloadSignal }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    getMyAssessmentsAPI(courseId)
      .then(({ data }) => { if (active) setData(data.data) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId, reloadSignal])

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (error || !data) return <p className="text-sm text-text-muted text-center py-10">Não foi possível carregar as avaliações.</p>

  const { config, assessments, situation, finalScore } = data
  const isSum = config.method === GRADING_METHODS.SUM
  const sit = situation || SITUATIONS.PENDENTE

  const fmtFinal = () => {
    if (finalScore == null) return '—'
    return isSum ? `${finalScore} / ${config.total ?? 0}` : finalScore.toFixed(1)
  }

  return (
    <div className="space-y-4">
      {/* Resumo: nota final + situação */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-surface-blue rounded-card text-center">
          <p className="text-xs text-text-muted mb-1">Nota final</p>
          <p className="text-3xl font-bold text-primary">{fmtFinal()}</p>
        </div>
        <div className="p-4 bg-surface-blue rounded-card text-center flex flex-col items-center justify-center gap-1">
          <p className="text-xs text-text-muted mb-1">Situação</p>
          <Badge variant={situationBadgeVariant(sit)} className="text-sm">{SITUATION_LABELS[sit]}</Badge>
        </div>
      </div>

      {/* Como é calculado */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted px-1">
        <Badge variant="blue" className="text-[10px]">{METHOD_LABELS[config.method]}</Badge>
        <span>{passingLabel(config.method)}: <strong className="text-text-primary">{config.passingGrade}</strong></span>
      </div>

      {/* Lista de avaliações */}
      {(assessments || []).length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-text-muted">Nenhuma avaliação cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assessments.map(a => {
            const max = isSum ? a.maxScore : 10
            const hasScore = a.published && a.score != null
            return (
              <div key={a._id} className="flex items-center gap-4 p-3 card">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm">{a.title}</p>
                  <p className="text-xs text-text-muted">
                    {TYPE_LABELS[a.type] || a.type}
                    {isSum && ` · vale ${a.maxScore} pts`}
                    {config.method === GRADING_METHODS.WEIGHTED && ` · peso ${a.weight}`}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {hasScore ? (
                    <>
                      <span className="text-xl font-bold text-primary">{a.score}</span>
                      <span className="text-text-muted text-xs">/{max}</span>
                    </>
                  ) : (
                    <Badge variant="gray" className="text-[10px]">Aguardando</Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentAssessmentsTab
