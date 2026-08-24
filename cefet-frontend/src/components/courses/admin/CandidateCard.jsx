import { Check, X, School as SchoolIcon } from 'lucide-react'
import { Avatar, Badge } from '../../ui/index'
import Button from '../../ui/Button'

// Card de um candidato (solicitação de entrada) na aba "Candidatos" do AdminCourse.
const CandidateCard = ({ request, actionLoading, onApprove, onReject }) => {
  const { _id, student, message, createdAt } = request
  const isLoading = actionLoading === _id

  return (
    <div className="card p-3 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar name={student?.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{student?.name}</p>
          <p className="text-xs text-text-muted truncate">{student?.email}</p>
          {student?.school?.name && (
            <div className="flex items-center gap-1 mt-0.5">
              <SchoolIcon size={11} className="text-text-muted flex-shrink-0" />
              <span className="text-[11px] text-text-muted truncate">{student.school.name}</span>
            </div>
          )}
        </div>
        <Badge variant="warning">Pendente</Badge>
      </div>

      {message && (
        <p className="text-xs text-text-secondary bg-surface-page rounded-lg px-3 py-2 leading-relaxed">
          "{message}"
        </p>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <span className="text-[11px] text-text-muted flex-1">
          Solicitado em {new Date(createdAt).toLocaleDateString('pt-BR')}
        </span>
        <Button
          variant="secondary"
          className="text-xs py-1.5 px-3 text-error border-error/30 hover:bg-error/10"
          loading={isLoading}
          onClick={() => onReject(request)}
        >
          <X size={13} /> Rejeitar
        </Button>
        <Button
          variant="primary"
          className="text-xs py-1.5 px-3"
          loading={isLoading}
          onClick={() => onApprove(request)}
        >
          <Check size={13} /> Aprovar
        </Button>
      </div>
    </div>
  )
}

export default CandidateCard