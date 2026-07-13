import Modal from '../../ui/Modal'
import { Avatar, Badge } from '../../ui/index'
import { GRADING_METHODS } from '../../../constants/gradingMethods'
import { SITUATIONS, SITUATION_LABELS } from '../../../constants/enrollmentSitutation'

const TYPE_LABELS = { prova: 'Prova', trabalho: 'Trabalho', participacao: 'Participação', outro: 'Outro' }

const situationBadgeVariant = (s) =>
  s === SITUATIONS.APROVADO ? 'success'
    : s === SITUATIONS.REPROVADO ? 'error'
      : s === SITUATIONS.DESISTENTE ? 'warning'
        : 'gray'

// Detalhe (somente leitura) das notas de um aluno, montado a partir das
// avaliações do curso e das notas lançadas. Edição fica na aba "Avaliações".
const StudentDetailModal = ({ open, enrollment, assessments, scores, config, onClose }) => {
  const student = enrollment?.user
  const method = config?.method
  const isSum = method === GRADING_METHODS.SUM

  // Mapa avaliação → nota deste aluno
  const scoreOf = (assessmentId) => {
    const row = (scores || []).find(
      s => String(s.assessment) === String(assessmentId) && String(s.student) === String(student?._id)
    )
    return row ? row.score : null
  }

  const sit = enrollment?.situation || SITUATIONS.PENDENTE

  return (
    <Modal open={open} onClose={onClose} title={student?.name || 'Aluno'} size="md">
      {student && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={student.name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary">{student.name}</p>
              <p className="text-sm text-text-muted truncate">{student.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Nota final</p>
              <p className="text-xl font-bold text-primary">
                {enrollment?.averageGrade != null ? enrollment.averageGrade : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Situação:</span>
            <Badge variant={situationBadgeVariant(sit)}>{SITUATION_LABELS[sit]}</Badge>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-text-primary text-sm mb-3">Notas por avaliação</h4>
            {(assessments || []).length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">Nenhuma avaliação criada ainda.</p>
            ) : (
              assessments.map(a => {
                const score = scoreOf(a._id)
                const max = isSum ? a.maxScore : 10
                return (
                  <div key={a._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                        {!a.published && <Badge variant="warning" className="text-[10px]">Rascunho</Badge>}
                      </div>
                      <p className="text-xs text-text-muted">{TYPE_LABELS[a.type] || a.type}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-lg font-bold text-primary">{score != null ? score : '—'}</span>
                      <span className="text-text-muted text-xs">/{max}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default StudentDetailModal
