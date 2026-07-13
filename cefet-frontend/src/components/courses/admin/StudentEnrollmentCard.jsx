import { ChevronRight as ChevronRightIcon, Award, Eye } from 'lucide-react'
import { Badge, Avatar } from '../../ui/index'
import Button from '../../ui/Button'
import { SITUATIONS, SITUATION_LABELS } from '../../../constants/enrollmentSitutation'

const situationBadgeVariant = (s) =>
  s === SITUATIONS.APROVADO ? 'success'
    : s === SITUATIONS.REPROVADO ? 'error'
      : s === SITUATIONS.DESISTENTE ? 'warning'
        : 'gray'

// Card de um aluno inscrito na aba "Alunos" do AdminCourse.
// Roster: mostra inscrição, média e situação (somente leitura — o lançamento de
// notas e a alteração de status ficam na aba "Avaliações") + certificado.
const StudentEnrollmentCard = ({
  enrollment,
  view = 'list',
  certificateEditable,
  certificateSaving,
  onOpenStudent,
  onReleaseCertificate,
  onPreviewCertificate,
}) => {
  const { _id, user: student, status, averageGrade, situation, certificateStatus } = enrollment
  const sit = situation || SITUATIONS.PENDENTE

  return (
    <div className="card p-3 space-y-3">
      {/* Linha principal: avatar + nome + status de inscrição */}
      <button
        onClick={() => onOpenStudent(enrollment)}
        className="w-full flex items-center gap-3 text-left"
      >
        <Avatar name={student.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{student.name}</p>
          <p className="text-xs text-text-muted truncate">{student.email}</p>
        </div>
        <Badge variant={status === 'ativo' ? 'success' : 'blue'}>
          {status === 'ativo' ? 'Ativo' : 'Inscrito'}
        </Badge>
        <ChevronRightIcon size={16} className="text-text-muted flex-shrink-0" />
      </button>

      {/* Linha de desempenho: média, situação e atalho para ver as notas */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">Média:</span>
          <span className="text-sm font-bold text-primary">
            {averageGrade != null ? averageGrade.toFixed(1) : '—'}
          </span>
        </div>

        <Badge variant={situationBadgeVariant(sit)}>{SITUATION_LABELS[sit]}</Badge>

        <Button
          variant="secondary"
          className="text-xs py-1.5 px-3 ml-auto"
          onClick={() => onOpenStudent(enrollment)}
        >
          <Eye size={13} /> Ver notas
        </Button>
      </div>

      {/* Certificado — só com o curso encerrado */}
      {certificateEditable && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <Award size={14} className="text-primary flex-shrink-0" />
          <span className="text-xs text-text-muted flex-shrink-0">Certificado:</span>
          <Badge variant={certificateStatus === 'emitido' ? 'success' : 'warning'}>
            {certificateStatus === 'emitido' ? 'Emitido' : 'Em análise'}
          </Badge>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              className="text-xs py-1 px-2"
              onClick={() => onPreviewCertificate(enrollment)}
            >
              <Eye size={13} /> Ver
            </Button>
            {certificateStatus === 'emitido' ? (
              <Button
                variant="secondary"
                className="text-xs py-1 px-2"
                loading={certificateSaving}
                onClick={() => onReleaseCertificate(_id, 'em_analise')}
              >
                Revogar
              </Button>
            ) : (
              <Button
                variant="primary"
                className="text-xs py-1.5 px-3"
                loading={certificateSaving}
                onClick={() => onReleaseCertificate(_id, 'emitido')}
              >
                Emitir certificado
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentEnrollmentCard
