import { useState } from 'react'
import { Avatar, Badge } from '../ui/index'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { getRoleLabel, formatDate } from '../../utils/formatDate'
import { useAuth } from '../../context/AuthContext'
import { canEditUserRole, getAssignableRoles } from '../../utils/permissions'

const roleBadge = { superadmin: 'error', admin: 'error', professor: 'blue', aluno: 'gray' }

const UserTable = ({ users, onRoleChange, loading }) => {
  const { role: myRole, user: me } = useAuth()
  const [confirm, setConfirm] = useState(null)
  const assignableRoles = getAssignableRoles(myRole)

  const handleChange = (user, newRole) => {
    if (!canEditUserRole(myRole, user.role)) return
    setConfirm({ user, newRole })
  }

  const confirmChange = () => {
    if (confirm) { onRoleChange(confirm.user._id, confirm.newRole); setConfirm(null) }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {['Usuário', 'E-mail', 'Função', 'Cadastro', 'Ação'].map(h => (
                <th key={h} className="pb-3 pr-4 text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-surface-page transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} size="sm" />
                    <span className="font-medium text-text-primary whitespace-nowrap">{u.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">{u.email}</td>
                <td className="py-3 pr-4">
                  <Badge variant={roleBadge[u.role] || 'gray'}>{getRoleLabel(u.role)}</Badge>
                </td>
                <td className="py-3 pr-4 text-text-muted whitespace-nowrap">{formatDate(u.createdAt)}</td>
                <td className="py-3">
                  {!canEditUserRole(myRole, u.role) || u._id === me?._id ? (
                    <span className="text-xs text-text-muted">—</span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => handleChange(u, e.target.value)}
                      className="text-xs border border-border rounded-btn px-2 py-1.5 bg-white text-text-primary focus:border-primary"
                      disabled={loading}
                    >
                      {assignableRoles.map(r => (
                        <option key={r} value={r}>{getRoleLabel(r)}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">Nenhum usuário encontrado.</div>
        )}
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Confirmar alteração" size="sm">
        {confirm && (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              Tem certeza que deseja alterar o cargo de <strong className="text-text-primary">{confirm.user.name}</strong> para{' '}
              <strong className="text-text-primary">{getRoleLabel(confirm.newRole)}</strong>?
            </p>
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1" onClick={confirmChange}>Confirmar</Button>
              <Button variant="secondary" onClick={() => setConfirm(null)}>Cancelar</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default UserTable
