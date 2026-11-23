// Turma fechada para escola(s) com código de acesso.
// Espelha cefet-backend/src/helpers/schoolAccessHelper.js (o backend refaz as validações).

// Sem 0/O/1/I: o código costuma ser ditado ou escrito no quadro em sala
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_REGEX = /^[A-Z0-9-]{4,20}$/

export const generateAccessCode = (length = 6) => {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (v) => CODE_ALPHABET[v % CODE_ALPHABET.length]).join('')
}

export const normalizeAccessCode = (v) => String(v ?? '').replace(/\s+/g, '').toUpperCase()

export const getAccessCodeError = (code) =>
  CODE_REGEX.test(normalizeAccessCode(code))
    ? ''
    : 'O código deve ter de 4 a 20 caracteres (letras, números ou hífen).'

const toId = (v) => String(v?._id || v || '')

export const isRestrictedCourse = (course) => (course?.restrictedSchools || []).length > 0

// A escola do usuário (id ou objeto populado) está entre as da turma?
export const userBelongsToCourseSchools = (user, course) => {
  const schoolId = toId(user?.school)
  if (!schoolId) return false
  return (course?.restrictedSchools || []).some((s) => toId(s) === schoolId)
}

export const formatSchoolNames = (schools = []) =>
  schools.map((s) => s?.name).filter(Boolean).join(', ')
