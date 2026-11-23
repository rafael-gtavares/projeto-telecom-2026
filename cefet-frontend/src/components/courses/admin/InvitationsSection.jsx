import { useEffect, useState } from 'react'
import { MailPlus, X } from 'lucide-react'
import { Badge, Spinner } from '../../ui/index'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { getCourseInvitationsAPI, cancelCourseInvitationAPI } from '../../../api/invitations'
import {
  formatDeadline,
  INVITATION_STATUS_LABELS,
  INVITATION_STATUS_BADGE,
} from '../../../utils/invitations'

// Convites enviados a quem ficou na fila de espera de outro curso. Pendentes
// reservam vaga até o prazo; o gestor pode cancelar e liberar a vaga.
// `version` muda quando novos convites são enviados (recarrega a lista).
const InvitationsSection = ({ courseId, version = 0, onChanged, showToast }) => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const load = () => {
    setLoading(true)
    getCourseInvitationsAPI(courseId)
      .then(({ data }) => setInvitations(data.data))
      .catch(() => setInvitations([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [courseId, version])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelCourseInvitationAPI(courseId, cancelTarget._id)
      showToast?.('Convite cancelado e vaga liberada.')
      setCancelTarget(null)
      load()
      onChanged?.()
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Erro ao cancelar convite')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>
  if (invitations.length === 0) return null

  const pending = invitations.filter((i) => i.status === 'pendente').length

  return (
    <div className="mt-8 space-y-3">
      <div className="flex items-center gap-2">
        <MailPlus size={18} className="text-primary" />
        <h3 className="font-semibold text-text-primary">
          Convites enviados — {invitations.length}
          {pending > 0 && <span className="text-text-muted font-normal"> ({pending} com vaga reservada)</span>}
        </h3>
      </div>

      <div className="space-y-2">
        {invitations.map((inv) => (
          <div
            key={inv._id}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-surface border border-border rounded-lg"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary truncate">{inv.student?.name || 'Usuário removido'}</p>
              <p className="text-xs text-text-muted truncate">
                {inv.student?.email}
                {inv.sourceCourse?.title && <> · fila de “{inv.sourceCourse.title}”</>}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-text-muted">
                {inv.status === 'pendente'
                  ? <>Vence em {formatDeadline(inv.expiresAt)}</>
                  : inv.respondedAt ? <>Em {formatDeadline(inv.respondedAt)}</> : null}
              </span>
              <Badge variant={INVITATION_STATUS_BADGE[inv.status]}>
                {INVITATION_STATUS_LABELS[inv.status] || inv.status}
              </Badge>
              {inv.status === 'pendente' && (
                <button
                  type="button"
                  onClick={() => setCancelTarget(inv)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5"
                  title="Cancelar convite"
                  aria-label="Cancelar convite"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancelar convite" size="sm">
        <p className="text-text-secondary text-sm mb-5">
          Cancelar o convite de <strong>{cancelTarget?.student?.name || 'este aluno'}</strong>? A vaga
          reservada será liberada e, se houver fila de espera, passará para o primeiro da fila.
        </p>
        <div className="flex gap-3">
          <Button className="flex-1 justify-center" loading={cancelling} onClick={handleCancel}>
            Cancelar convite
          </Button>
          <Button variant="secondary" onClick={() => setCancelTarget(null)} disabled={cancelling}>
            Voltar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default InvitationsSection
