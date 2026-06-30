const ROLES = {
  STUDENT: 'aluno',
  PROFESSOR: 'professor',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

const ROLE_HIERARCHY = {
  [ROLES.STUDENT]: 1,
  [ROLES.PROFESSOR]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.SUPERADMIN]: 4,
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
};