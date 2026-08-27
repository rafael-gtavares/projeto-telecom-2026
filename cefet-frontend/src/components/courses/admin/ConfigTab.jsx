import { Plus, CheckCircle } from 'lucide-react'
import { Spinner, Badge, Avatar } from '../../ui/index'
import { isAdmin as isAdminRole } from '../../../utils/permissions'

const STATUS_OPTIONS = [
  { key: 'draft', label: 'Rascunho', desc: 'Oculto para alunos', dot: 'bg-text-muted' },
  { key: 'published', label: 'Publicado', desc: 'Visível, inscrições abertas', dot: 'bg-success' },
  { key: 'vagas_encerradas', label: 'Vagas Encerradas', desc: 'Visível, sem novas inscrições', dot: 'bg-orange-500' },
  { key: 'em_andamento', label: 'Em Andamento', desc: 'Curso em execução', dot: 'bg-blue-500' },
  { key: 'closed', label: 'Encerrado', desc: 'Curso finalizado', dot: 'bg-warning' },
]

const ConfigTab = ({ course, configUsers, configUsersLoading, onGrantAccess, onRevokeAccess }) => (
  <div className="p-4 md:p-6 space-y-6">

    {/* Status do Curso — somente leitura (alterado automaticamente pelas datas) */}
    <div className="pb-6 border-b border-border">
      <h3 className="font-semibold text-text-primary mb-1">Status do curso</h3>
      <p className="text-xs text-text-muted mb-4">
        O status é definido automaticamente conforme as datas do curso. "Vagas Encerradas" é uma exceção: pode ser definido manualmente na edição do curso para bloquear novas inscrições antes do início.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {STATUS_OPTIONS.map(opt => {
          const isCurrent = course.status === opt.key
          return (
            <div
              key={opt.key}
              className={`p-3 rounded-xl border text-left ${isCurrent
                ? 'border-primary bg-primary/5'
                : 'border-border bg-white opacity-50'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                <span className={`text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-text-primary'}`}>
                  {opt.label}
                </span>
                {isCurrent && <CheckCircle size={13} className="text-primary ml-auto" />}
              </div>
              <p className="text-xs text-text-muted pl-4">{opt.desc}</p>
            </div>
          )
        })}
      </div>
    </div>

    <div>
      <h3 className="font-semibold text-text-primary mb-1">Acesso ao curso</h3>
      <p className="text-xs text-text-muted mb-4">
        Professores com acesso podem gerenciar aulas, materiais e notas. Admins sempre têm acesso total.
      </p>

      {configUsersLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="space-y-2">
          {configUsers.map(u => {
            const isCreator = course.professor?._id === u._id || course.professor === u._id
            const isAdmin = isAdminRole(u.role)
            const hasAccess = isCreator || isAdmin || (course.allowedProfessors || []).some(p => p._id === u._id)

            return (
              <div key={u._id} className="flex items-center gap-3 p-3 card">
                <Avatar name={u.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </div>

                {isCreator ? (
                  <Badge variant="blue">Criador</Badge>
                ) : isAdmin ? (
                  <Badge variant="success">Admin</Badge>
                ) : hasAccess ? (
                  <button
                    onClick={() => onRevokeAccess(u._id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-success border border-success/30 bg-success/5 hover:bg-error/10 hover:text-error hover:border-error/30 px-3 py-1.5 rounded-full transition-all"
                  >
                    <CheckCircle size={13} /> Com acesso
                  </button>
                ) : (
                  <button
                    onClick={() => onGrantAccess(u._id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-text-muted border border-border hover:bg-primary/5 hover:text-primary hover:border-primary/30 px-3 py-1.5 rounded-full transition-all"
                  >
                    <Plus size={13} /> Sem acesso
                  </button>
                )}
              </div>
            )
          })}
          {configUsers.length === 0 && (
            <p className="text-sm text-text-muted text-center py-6">Nenhum professor ou admin encontrado.</p>
          )}
        </div>
      )}
    </div>
  </div>
)

export default ConfigTab
