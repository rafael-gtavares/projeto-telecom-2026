import { useState } from 'react'
import { SITUATIONS, SITUATION_OPTIONS } from '../../../constants/enrollmentSitutation'
import StudentEnrollmentCard from './StudentEnrollmentCard'

const StudentsTab = ({
  students,
  course,
  situationLoading,
  certificateSavingId,
  onOpenStudent,
  onOpenGrade,
  onChangeSituation,
  onReleaseCertificate,
  onPreviewCertificate,
}) => {
  const [situationFilter, setSituationFilter] = useState('all')

  const situationEditable = course.status === 'closed'

  const filteredStudents = situationFilter === 'all'
    ? students
    : students.filter(s => (s.situation || SITUATIONS.PENDENTE) === situationFilter)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-text-primary">
          Alunos inscritos — {filteredStudents.length} de {students.length} aluno{students.length !== 1 ? 's' : ''}
        </h3>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted flex-shrink-0">Filtrar por situação:</span>
          <select
            value={situationFilter}
            onChange={(e) => setSituationFilter(e.target.value)}
            className="input-field text-xs py-1.5"
          >
            <option value="all">Todas</option>
            {SITUATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!situationEditable && (
        <p className="text-xs text-text-muted bg-surface-page px-3 py-2 rounded-lg">
          A situação dos alunos só pode ser alterada quando o curso estiver <strong>Encerrado</strong>.
        </p>
      )}

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          {students.length === 0
            ? 'Nenhum aluno inscrito ainda.'
            : 'Nenhum aluno encontrado com essa situação.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredStudents.map(enrollment => (
            <StudentEnrollmentCard
              key={enrollment._id}
              enrollment={enrollment}
              situationEditable={situationEditable}
              situationSaving={situationLoading === enrollment._id}
              certificateEditable={situationEditable}
              certificateSaving={certificateSavingId === enrollment._id}
              onOpenStudent={onOpenStudent}
              onOpenGrade={onOpenGrade}
              onChangeSituation={onChangeSituation}
              onReleaseCertificate={onReleaseCertificate}
              onPreviewCertificate={onPreviewCertificate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentsTab
