// Fonte única de verdade para roles no frontend.
// Espelha cefet-backend/src/constants/roles.js — qualquer mudança de
// hierarquia deve ser feita nos dois lados.

export const ROLES = {
  STUDENT: 'aluno',
  PROFESSOR: 'professor',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
}

// Quanto maior o número, mais permissões o role tem.
// Usado para comparações hierárquicas (>=) em vez de igualdade direta.
export const ROLE_HIERARCHY = {
  [ROLES.STUDENT]: 1,
  [ROLES.PROFESSOR]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.SUPERADMIN]: 4,
}

// Labels exibidos na UI (badges, menus, etc.)
export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Aluno',
  [ROLES.PROFESSOR]: 'Professor',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SUPERADMIN]: 'Superadmin',
}
