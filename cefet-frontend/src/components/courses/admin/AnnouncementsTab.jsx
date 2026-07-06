import { Plus, Trash2, Megaphone } from 'lucide-react'
import { Badge } from '../../ui/index'
import Button from '../../ui/Button'
import { formatDate } from '../../../utils/formatDate'

// Rótulo dos destinatários de um aviso individual: nomes se forem poucos,
// senão a contagem (evita estourar o card com muitos nomes).
const recipientsLabel = (recipients = []) => {
  const names = recipients.map((r) => r?.name).filter(Boolean)
  if (names.length === 0) return 'Individual'
  if (names.length <= 3) return `Para ${names.join(', ')}`
  return `Para ${names.length} alunos`
}

const AnnouncementsTab = ({ announcements, onCreate, onDelete }) => (
  <div className="p-4 md:p-6 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-text-muted">Comunique a turma ou um aluno específico. O aviso gera uma notificação.</p>
      <Button variant="primary" className="gap-2 text-sm flex-shrink-0" onClick={onCreate}>
        <Plus size={15} /> Novo aviso
      </Button>
    </div>

    {announcements.length === 0 ? (
      <div className="text-center py-12 text-text-muted text-sm">
        <Megaphone size={28} className="mx-auto mb-2 opacity-40" />
        Nenhum aviso enviado ainda.
      </div>
    ) : (
      <div className="space-y-3">
        {announcements.map(av => (
          <div key={av._id} className="card p-4 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-card bg-surface-hover flex items-center justify-center flex-shrink-0 text-primary">
              <Megaphone size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-text-primary text-sm">{av.title}</h4>
                {av.audience === 'individual'
                  ? <Badge variant="blue" className="text-[10px]">{recipientsLabel(av.recipients)}</Badge>
                  : <Badge variant="gray" className="text-[10px]">Turma toda</Badge>}
              </div>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed whitespace-pre-line line-clamp-4">{av.message}</p>
              <p className="text-[11px] text-text-muted mt-2">
                {av.author?.name ? `${av.author.name} · ` : ''}{formatDate(av.createdAt)}
              </p>
            </div>
            <button onClick={() => onDelete(av._id)}
              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors flex-shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)

export default AnnouncementsTab
