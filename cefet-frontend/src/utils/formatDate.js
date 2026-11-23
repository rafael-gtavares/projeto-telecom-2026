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

// Formato compacto dd/mm/aaaa. Usa UTC como formatDate (datas de curso/nascimento
// são gravadas à meia-noite UTC), então o dia exibido não muda com o fuso do navegador.
export const formatDateShort = (dateStr) => {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''

  const dia = String(date.getUTCDate()).padStart(2, '0')
  const mes = String(date.getUTCMonth() + 1).padStart(2, '0')

  return `${dia}/${mes}/${date.getUTCFullYear()}`
}

// Para timestamps reais (ex.: createdAt): usa o fuso local do navegador, para que
// um envio à noite não apareça no dia seguinte (formatDate usa UTC por causa das
// datas de curso, que são gravadas à meia-noite UTC).
export const formatLocalDate = (dateStr) => {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''

  const dia = String(date.getDate()).padStart(2, '0')
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ]

  return `${dia} de ${meses[date.getMonth()]} de ${date.getFullYear()}`
}

export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()

export const getRoleLabel = (role) => ROLE_LABELS[role] || role

export const getIncomeLabel = (val) => ({
  ate_1sm: 'Até 1 salário mínimo', '1_a_2sm': 'De 1 a 2 salários mínimos',
  '2_a_3sm': 'De 2 a 3 salários mínimos', '3_a_5sm': 'De 3 a 5 salários mínimos',
  acima_5sm: 'Acima de 5 salários mínimos', prefiro_nao_informar: 'Prefiro não informar',
}[val] || val)

export const getGenderLabel = (val) => ({
  masculino: 'Masculino', feminino: 'Feminino', prefiro_nao_informar: 'Prefiro não informar',
}[val] || val)

export const getSchoolLevelLabel = (val) => ({
  ensino_fundamental: 'Ensino Fundamental',
  '1_ou_2_ano_em': '1º ou 2º Ano do Ensino Médio',
  ultimo_ano_em: 'Último ano do Ensino Médio',
  ensino_medio_finalizado: 'Ensino Médio Finalizado',
  eja: 'EJA',
  superior_completo: 'Ensino Superior Completo',
  superior_incompleto: 'Ensino Superior Incompleto',
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