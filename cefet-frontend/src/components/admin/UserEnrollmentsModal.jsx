import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Clock, BookOpen } from 'lucide-react'
import Modal from '../ui/Modal'
import { Badge, Spinner, Avatar } from '../ui/index'
import { getUserEnrollmentsAPI } from '../../api/courses'
import { SITUATIONS, SITUATION_LABELS } from '../../constants/enrollmentSitutation'
import { formatDate } from '../../utils/formatDate'

const situationVariant = (situation) => {
  if (situation === SITUATIONS.APROVADO) return 'success'
  if (situation === SITUATIONS.REPROVADO) return 'error'
  if (situation === SITUATIONS.DESISTENTE) return 'warning'
  return 'gray'
}

// Modal de "Ver matrículas" — mostra, para um único aluno, todos os cursos
// em que já se inscreveu. Segue o mesmo padrão visual de CourseTable,
// trocando as colunas Vagas/Status/Ações por Média/Situação.
const UserEnrollmentsModal = ({ open, user, onClose }) => {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !user) return

    setLoading(true)
    setError(null)

    getUserEnrollmentsAPI(user._id)
      .then(({ data }) => setEnrollments(Array.isArray(data) ? data : []))
      .catch(() => setError('Erro ao carregar matrículas.'))
      .finally(() => setLoading(false))
  }, [open, user])

  return (
    <Modal open={open} onClose={onClose} title="Matrículas do aluno" size="xl">
      {user && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="lg" />
            <div>
              <p className="font-semibold text-text-primary">{user.name}</p>
              <p className="text-sm text-text-muted">{user.email}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : error ? (
              <p className="text-sm text-error-text text-center py-6">{error}</p>
            ) : enrollments.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">
                Este aluno ainda não se inscreveu em nenhum curso.
              </p>
            ) : (
              <div className="overflow-x-auto">

                {/* Layout em cards para mobile — visível apenas abaixo de sm */}
                <div className="sm:hidden space-y-3">
                  {enrollments.map(e => {
                    const course = e.course || {}
                    return (
                      <div key={e._id} className="flex items-center gap-3 p-3 border border-border rounded-card">
                        <div className="w-12 h-12 rounded-lg bg-surface-hover flex-shrink-0 overflow-hidden border border-border flex items-center justify-center text-text-muted">
                          <BookOpen size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-primary text-sm truncate">{course.title || 'Curso removido'}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant={situationVariant(e.situation)}>
                              {SITUATION_LABELS[e.situation] || SITUATION_LABELS[SITUATIONS.PENDENTE]}
                            </Badge>
                            <span className="text-xs text-text-muted">
                              Média: {e.averageGrade != null ? e.averageGrade.toFixed(1) : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Tabela — visível a partir de sm */}
                <table className="w-full text-sm hidden sm:table">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Curso</th>
                      <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Criado por</th>
                      <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Período / Dias</th>
                      <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Média</th>
                      <th className="pb-3 pr-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enrollments.map(e => {
                      const course = e.course || {}
                      const isMultiDay = course.startDate && course.endDate &&
                        new Date(course.startDate).toDateString() !== new Date(course.endDate).toDateString()

                      return (
                        <tr key={e._id} className="hover:bg-surface-page transition-colors">
                          {/* COLUNA: CURSO */}
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3 ml-1">
                              <div className="w-12 h-12 rounded-lg bg-surface-hover flex-shrink-0 overflow-hidden border border-border flex items-center justify-center text-text-muted">
                                <BookOpen size={20} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-text-primary max-w-[180px] truncate">
                                  {course.title || 'Curso removido'}
                                </span>
                                {course._id && (
                                  <span className="text-[11px] text-text-muted">ID: {course._id.slice(-6)}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* COLUNA: CRIADO POR */}
                          <td className="py-4 pr-4 text-text-secondary font-medium whitespace-nowrap hidden lg:table-cell">
                            {course.professor?.name || '—'}
                          </td>

                          {/* COLUNA: PERÍODO / DIAS */}
                          <td className="py-4 pr-4 whitespace-nowrap hidden md:table-cell">
                            <div className="flex flex-col gap-1 min-w-0 max-w-[240px]">
                              <div className="flex items-center gap-1.5 text-text-primary font-semibold text-xs truncate overflow-hidden">
                                <CalendarIcon size={13} className="text-primary" />
                                <span className="truncate">
                                  {course.startDate
                                    ? (isMultiDay
                                      ? `${formatDate(course.startDate)} - ${formatDate(course.endDate)}`
                                      : formatDate(course.startDate))
                                    : '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-text-muted text-[11px] truncate overflow-hidden">
                                <Clock size={13} />
                                <span className="truncate capitalize">
                                  {course.modality?.replace('_', ' ') || 'Presencial'}
                                  {course.location ? ` · ${course.location}` : ''}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* COLUNA: MÉDIA */}
                          <td className="py-4 pr-4 whitespace-nowrap">
                            <span className="text-text-primary font-bold">
                              {e.averageGrade != null ? e.averageGrade.toFixed(1) : '—'}
                            </span>
                          </td>

                          {/* COLUNA: SITUAÇÃO */}
                          <td className="py-4 pr-4">
                            <Badge variant={situationVariant(e.situation)}>
                              {SITUATION_LABELS[e.situation] || SITUATION_LABELS[SITUATIONS.PENDENTE]}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default UserEnrollmentsModal