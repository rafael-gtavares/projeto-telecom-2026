import { useEffect, useState } from 'react'
import { MailPlus, Calendar, MapPin, User, Clock, Ban, CheckCircle, BookOpen } from 'lucide-react'
import { Badge } from '../ui/index'
import Button from '../ui/Button'
import { acceptInvitationAPI, declineInvitationAPI } from '../../api/invitations'
import { formatDate } from '../../utils/formatDate'
import { formatModality } from '../../utils/formatModality'
import {
  formatDeadline,
  INVITATION_STATUS_LABELS,
  INVITATION_STATUS_BADGE,
} from '../../utils/invitations'

// Lista de convites do aluno (aba "Convites" de Meus Cursos). Convites
// pendentes têm vaga reservada até o prazo; o aluno aceita ou recusa.
const MyInvitations = ({ invitations, onChanged, showMessage }) => {
  const [busy, setBusy] = useState(null) // `${id}:accept` | `${id}:decline`
  const [conflicts, setConflicts] = useState({}) // id → conflitos retornados no aceite

  // Lista recarregada (ex.: aluno cancelou o curso conflitante): usa os conflitos novos
  useEffect(() => setConflicts({}), [invitations])

  const respond = async (inv, action) => {
    setBusy(`${inv._id}:${action}`)
    try {
      const { data } = action === 'accept'
        ? await acceptInvitationAPI(inv._id)
        : await declineInvitationAPI(inv._id)
      showMessage?.(data.message)
      onChanged?.(action)
    } catch (err) {
      const res = err.response?.data
      if (res?.code === 'SCHEDULE_CONFLICT') {
        setConflicts((c) => ({ ...c, [inv._id]: res.conflicts }))
      } else {
        showMessage?.(res?.message || 'Não foi possível responder ao convite.')
        onChanged?.()
      }
    } finally {
      setBusy(null)
    }
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-b-card border border-border md:border-none">
        <div className="w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
          <MailPlus size={32} className="text-text-muted" />
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2">Nenhum convite</h3>
        <p className="text-text-secondary text-sm max-w-xs mx-auto">
          Quando você ficar na fila de espera de um curso e abrir uma nova turma, o convite aparecerá aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {invitations.map((inv) => {
        const { course } = inv
        const pending = inv.status === 'pendente'
        const blocking = conflicts[inv._id] || inv.conflicts || []

        return (
          <div
            key={inv._id}
            className={`card p-5 bg-white border ${pending ? 'border-primary/30' : 'border-border opacity-80'}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <h3 className="font-bold text-text-primary text-lg leading-snug">{course.title}</h3>
                {inv.sourceCourse?.title && (
                  <p className="text-xs text-text-muted mt-0.5">
                    Você ficou na fila de espera de “{inv.sourceCourse.title}”
                  </p>
                )}
              </div>
              <Badge variant={INVITATION_STATUS_BADGE[inv.status]} className="flex-shrink-0">
                {INVITATION_STATUS_LABELS[inv.status] || inv.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary mb-3">
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(course.startDate)}</span>
              <span className="flex items-center gap-1.5"><BookOpen size={14} /> {formatModality(course.modality)}</span>
              {course.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {course.location}</span>}
              {(course.instructor || course.professor?.name) && (
                <span className="flex items-center gap-1.5"><User size={14} /> {course.instructor || course.professor.name}</span>
              )}
            </div>

            {pending && (
              <>
                <p className="flex items-center gap-2 text-sm text-text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mb-3">
                  <Clock size={15} className="text-primary flex-shrink-0" />
                  <span>Sua vaga está reservada até <strong>{formatDeadline(inv.expiresAt)}</strong>.</span>
                </p>

                {blocking.length > 0 && (
                  <div className="flex items-start gap-2 bg-error/5 border border-error/20 rounded-lg px-3 py-2.5 mb-3">
                    <Ban size={15} className="text-error flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-text-primary">
                      <p className="mb-1">
                        <strong>Conflito de horário.</strong> Você já está inscrito em um curso com atividades
                        no mesmo horário. Para aceitar, cancele a inscrição conflitante antes do fim do prazo.
                      </p>
                      <ul className="space-y-0.5">
                        {blocking.map((c) => (
                          <li key={c.course._id} className="text-text-secondary">
                            <span className="font-medium text-text-primary">{c.course.title}</span>
                            {' — '}
                            {c.slots.slice(0, 3).map((s, i) => (
                              <span key={i}>
                                {i > 0 && '; '}
                                {formatDate(s.date)} {s.startTime}–{s.endTime}
                              </span>
                            ))}
                            {c.slots.length > 3 && ` e mais ${c.slots.length - 3}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 justify-center"
                    loading={busy === `${inv._id}:accept`}
                    disabled={!!busy || blocking.length > 0}
                    onClick={() => respond(inv, 'accept')}
                  >
                    <CheckCircle size={16} /> Aceitar convite
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-center"
                    loading={busy === `${inv._id}:decline`}
                    disabled={!!busy}
                    onClick={() => respond(inv, 'decline')}
                  >
                    Recusar
                  </Button>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MyInvitations
