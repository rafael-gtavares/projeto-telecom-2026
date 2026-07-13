import { useState } from 'react'
import { SITUATIONS, SITUATION_OPTIONS } from '../../../constants/enrollmentSitutation'
import { ViewToggle } from '../../ui/index'
import StudentEnrollmentCard from './StudentEnrollmentCard'

const StudentsTab = ({
  students,
  course,
  certificateSavingId,
  studentsView,
  onToggleView,
  onOpenStudent,
  onReleaseCertificate,
  onPreviewCertificate,
}) => {
  const [situationFilter, setSituationFilter] = useState('all')

  const certificateEditable = course.status === 'closed'

  const filteredStudents = situationFilter === 'all'
    ? students
    : students.filter(s => (s.situation || SITUATIONS.PENDENTE) === situationFilter)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-text-primary">
          Alunos inscritos — {filteredStudents.length} de {students.length} aluno{students.length !== 1 ? 's' : ''}
        </h3>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted flex-shrink-0">Situação:</span>
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
          {students.length > 0 && <ViewToggle value={studentsView} onChange={onToggleView} />}
        </div>
      </div>

      <p className="text-xs text-text-muted bg-surface-page px-3 py-2 rounded-lg">
        O lançamento de notas e a situação dos alunos ficam na aba <strong>Avaliações</strong>.
      </p>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          {students.length === 0
            ? 'Nenhum aluno inscrito ainda.'
            : 'Nenhum aluno encontrado com essa situação.'}
        </div>
      ) : (
        <div className={studentsView === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2'}>
          {filteredStudents.map(enrollment => (
            <StudentEnrollmentCard
              key={enrollment._id}
              enrollment={enrollment}
              view={studentsView}
              certificateEditable={certificateEditable}
              certificateSaving={certificateSavingId === enrollment._id}
              onOpenStudent={onOpenStudent}
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
