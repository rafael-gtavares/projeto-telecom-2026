// Helpers centralizados de permissão.
// Nenhum componente deve comparar `user.role === '...'` diretamente —
// toda regra de acesso passa por aqui, espelhando a lógica de
// cefet-backend/src/middleware/roles.js (requireMinimumRole).

import { ROLES, ROLE_HIERARCHY } from '../constants/roles'

/**
 * Compara hierarquicamente: o usuário tem PELO MENOS o nível do role exigido?
 * Ex: hasMinimumRole('superadmin', 'admin') -> true
 *     hasMinimumRole('professor', 'admin')   -> false
 */
export const hasMinimumRole = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  return userLevel >= requiredLevel
}

/** Comparação exata, para os poucos casos em que hierarquia não se aplica. */
export const isExactRole = (userRole, role) => userRole === role

export const isStudent = (userRole) => userRole === ROLES.STUDENT

// "É professor" no sentido hierárquico: professor, admin e superadmin
// possuem pelo menos o nível de professor.
export const isTeacher = (userRole) => hasMinimumRole(userRole, ROLES.PROFESSOR)

// "É admin" no sentido hierárquico: admin e superadmin.
export const isAdmin = (userRole) => hasMinimumRole(userRole, ROLES.ADMIN)

// Superadmin é sempre comparação exata — não existe nada "acima" dele.
export const isSuperAdmin = (userRole) => userRole === ROLES.SUPERADMIN

/**
 * Acesso à "casca" do painel (/admin): é usado tanto pelo dashboard do
 * professor (gerencia seus próprios cursos) quanto pelo do admin/superadmin.
 * As seções restritas dentro do painel (Usuários, Escolas) usam
 * canManageUsers / canManageSchools, que exigem nível admin.
 */
export const canAccessAdminPanel = (userRole) => hasMinimumRole(userRole, ROLES.PROFESSOR)

export const canManageUsers = (userRole) => isAdmin(userRole)
export const canManageSchools = (userRole) => isAdmin(userRole)

/** Apenas superadmin pode promover alguém a admin. */
export const canPromoteToAdmin = (userRole) => isSuperAdmin(userRole)

/**
 * Lista de roles que o usuário logado pode ATRIBUIR a outra pessoa,
 * usada para popular o <select> de cargos no painel de usuários.
 *  - admin:      aluno, professor
 *  - superadmin: aluno, professor, admin
 */
export const getAssignableRoles = (actorRole) => {
  if (isSuperAdmin(actorRole)) return [ROLES.STUDENT, ROLES.PROFESSOR, ROLES.ADMIN]
  if (isAdmin(actorRole)) return [ROLES.STUDENT, ROLES.PROFESSOR]
  return []
}

/**
 * Regra de quem pode editar o cargo de quem:
 *  - ninguém edita um superadmin
 *  - admin só edita aluno/professor (não pode tocar em outro admin)
 *  - superadmin edita aluno/professor/admin
 */
export const canEditUserRole = (actorRole, targetRole) => {
  if (targetRole === ROLES.SUPERADMIN) return false
  if (isSuperAdmin(actorRole)) return true
  if (isAdmin(actorRole)) return targetRole === ROLES.STUDENT || targetRole === ROLES.PROFESSOR
  return false
}
