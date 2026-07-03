import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { Avatar, Badge } from '../ui/index'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import UserEnrollmentsModal from './UserEnrollmentsModal'
import { getRoleLabel, formatDate } from '../../utils/formatDate'
import { useAuth } from '../../context/AuthContext'
import { canEditUserRole, getAssignableRoles } from '../../utils/permissions'

const roleBadge = {
  superadmin: 'error',
  admin: 'error',
  professor: 'blue',
  aluno: 'gray'
}

const UserTable = ({
  users,
  onRoleChange,
  loading,
  onToggleEditPermission
}) => {
  const { role: myRole, user: me } = useAuth()

  const [confirm, setConfirm] = useState(null)
  const [permissionConfirm, setPermissionConfirm] = useState(null)
  const [enrollmentsUser, setEnrollmentsUser] = useState(null)

  const assignableRoles = getAssignableRoles(myRole)

  // ================= ROLE =================
  const handleChange = (user, newRole) => {
    if (!canEditUserRole(myRole, user.role)) return
    setConfirm({ user, newRole })
  }

  const confirmChange = () => {
    if (confirm) {
      onRoleChange(confirm.user._id, confirm.newRole)
      setConfirm(null)
    }
  }

  // ================= PERMISSION =================
  const handlePermissionChange = (user, value) => {
    setPermissionConfirm({ user, value })
  }

  const confirmPermissionChange = () => {
    if (permissionConfirm) {
      onToggleEditPermission(
        permissionConfirm.user._id,
        permissionConfirm.value
      )
      setPermissionConfirm(null)
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          <thead>
            <tr className="border-b border-border text-left">
              {[
                'Usuário',
                'E-mail',
                'Função',
                'Cadastro',
                'Cargo',
                'Permissão',
                'Matrículas',
              ].map(h => (
                <th
                  key={h}
                  className="pb-3 pr-4 text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-surface-page transition-colors">

                {/* USER */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} size="sm" />
                    <span className="font-medium text-text-primary whitespace-nowrap">
                      {u.name}
                    </span>
                  </div>
                </td>

                {/* EMAIL */}
                <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                  {u.email}
                </td>

                {/* ROLE BADGE */}
                <td className="py-3 pr-4">
                  <Badge variant={roleBadge[u.role] || 'gray'}>
                    {getRoleLabel(u.role)}
                  </Badge>
                </td>

                {/* CREATED AT */}
                <td className="py-3 pr-4 text-text-muted whitespace-nowrap">
                  {formatDate(u.createdAt)}
                </td>

                {/* ROLE CONTROL */}
                <td className="py-3 pr-4 text-center">
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
                        <option key={r} value={r}>
                          {getRoleLabel(r)}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                {/* PERMISSION CONTROL (COM MODAL) */}
                <td className="py-3 pr-4 text-center">
                  {u.role === 'aluno' ? (
                    <select
                      value={u.canEditPersonalInfo ? 'true' : 'false'}
                      onChange={e =>
                        handlePermissionChange(
                          u,
                          e.target.value === 'true'
                        )
                      }
                      className="text-xs border border-border rounded-btn px-2 py-1.5 bg-white text-text-primary focus:border-primary"
                      disabled={loading}
                    >
                      <option value="true">Edição liberada</option>
                      <option value="false">Edição bloqueada</option>
                    </select>
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </td>

                {/* MATRÍCULAS */}
                <td className="py-3 pr-4 text-center">
                  <button
                    onClick={() => setEnrollmentsUser(u)}
                    title="Ver matrículas"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-all"
                  >
                    <GraduationCap size={13} /> Ver matrículas
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>

      {/* ================= ROLE MODAL ================= */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Confirmar alteração"
        size="sm"
      >
        {confirm && (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              Tem certeza que deseja alterar o cargo de{' '}
              <strong className="text-text-primary">
                {confirm.user.name}
              </strong>{' '}
              para{' '}
              <strong className="text-text-primary">
                {getRoleLabel(confirm.newRole)}
              </strong>
              ?
            </p>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={confirmChange}>
                Confirmar
              </Button>

              <Button
                variant="secondary"
                onClick={() => setConfirm(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= PERMISSION MODAL ================= */}
      <Modal
        open={!!permissionConfirm}
        onClose={() => setPermissionConfirm(null)}
        title="Confirmar alteração de permissão"
        size="sm"
      >
        {permissionConfirm && (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              Tem certeza que deseja{' '}
              <strong className="text-text-primary">
                {permissionConfirm.value
                  ? 'LIBERAR'
                  : 'BLOQUEAR'}
              </strong>{' '}
              a edição de dados de{' '}
              <strong className="text-text-primary">
                {permissionConfirm.user.name}
              </strong>
              ?
            </p>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={confirmPermissionChange}
              >
                Confirmar
              </Button>

              <Button
                variant="secondary"
                onClick={() => setPermissionConfirm(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MATRÍCULAS MODAL ================= */}
      <UserEnrollmentsModal
        open={!!enrollmentsUser}
        user={enrollmentsUser}
        onClose={() => setEnrollmentsUser(null)}
      />
    </>
  )
}

export default UserTable