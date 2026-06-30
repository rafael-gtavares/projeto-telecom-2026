import { ROLE_LABELS } from '../constants/roles'

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  
  const dia = String(date.getUTCDate()).padStart(2, '0')
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ]
  const mes = meses[date.getUTCMonth()]
  const ano = date.getUTCFullYear()

  return `${dia} de ${mes} de ${ano}`
}

export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()

export const getRoleLabel = (role) => ROLE_LABELS[role] || role

export const getIncomeLabel = (val) => ({
  ate_1sm: 'Até 1 salário mínimo', '1_a_2sm': 'De 1 a 2 salários mínimos',
  '2_a_3sm': 'De 2 a 3 salários mínimos', '3_a_5sm': 'De 3 a 5 salários mínimos',
  acima_5sm: 'Acima de 5 salários mínimos', prefiro_nao_informar: 'Prefiro não informar',
}[val] || val)

export const parseUTCDate = (dateStr) => {
  if (!dateStr) return null

  const date = new Date(dateStr)

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  )
}

export const formatDateForInput = (dateStr) => {
  if (!dateStr) return ''

  const date = new Date(dateStr)

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
