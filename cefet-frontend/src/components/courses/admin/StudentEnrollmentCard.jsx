import { Plus, ChevronRight as ChevronRightIcon, Award, Eye } from 'lucide-react'
import { Badge, Avatar } from '../../ui/index'
import Button from '../../ui/Button'
import { SITUATIONS, SITUATION_OPTIONS } from '../../../constants/enrollmentSitutation'

// Card de um aluno inscrito na aba "Alunos" do AdminCourse.
// Mostra avatar/status de inscrição, média geral, situação (editável quando
// o curso está Encerrado) e atalhos para ver notas / lançar nota.
const StudentEnrollmentCard = ({
  enrollment,
  situationEditable,
  situationSaving,
  certificateEditable,
  certificateSaving,
  onOpenStudent,
  onOpenGrade,
  onChangeSituation,
  onReleaseCertificate,
  onPreviewCertificate,
}) => {
  const { _id, user: student, status, averageGrade, situation, certificateStatus } = enrollment

  return (
    <div className="card p-3 space-y-3">
      {/* Linha principal: avatar + nome + status de inscrição */}
      <button
        onClick={() => onOpenStudent(student)}
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

      {/* Linha de desempenho: média, situação e ações */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">Média:</span>
          <span className="text-sm font-bold text-primary">
            {averageGrade != null ? averageGrade.toFixed(1) : '—'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
          <span className="text-xs text-text-muted flex-shrink-0">Situação:</span>
          <select
            value={situation || SITUATIONS.PENDENTE}
            disabled={!situationEditable || situationSaving}
            onChange={(e) => onChangeSituation(_id, e.target.value)}
            className="input-field text-xs py-1.5 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {SITUATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 flex-shrink-0 ml-auto">
          <Button
            variant="secondary"
            className="text-xs py-1.5 px-3"
            onClick={() => onOpenStudent(student)}
          >
            Ver notas
          </Button>
          <Button
            variant="primary"
            className="text-xs py-1.5 px-3 gap-1"
            onClick={() => onOpenGrade(student)}
          >
            <Plus size={13} /> Lançar nota
          </Button>
        </div>
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
