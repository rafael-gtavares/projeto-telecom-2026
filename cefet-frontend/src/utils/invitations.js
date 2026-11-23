// Helpers dos convites para quem ficou na fila de espera de outro curso.
// Espelham cefet-backend/src/helpers/invitationHelper.js.

const DAY_MS = 24 * 60 * 60 * 1000
const BR_OFFSET_MS = 3 * 60 * 60 * 1000

// Início do dia (00:00 de Brasília) de uma data 'AAAA-MM-DD' ou ISO, em ms UTC
const brDayStart = (date) => {
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + BR_OFFSET_MS
}

// Maior prazo (em dias inteiros) que não ultrapassa o início do curso.
// null quando ainda não há data de início definida.
export const getMaxInviteDays = (startDate, now = Date.now()) => {
  const start = brDayStart(startDate)
  if (start == null) return null
  return Math.max(0, Math.floor((start - now) / DAY_MS))
}

// Data em que um convite com `days` de prazo, enviado agora, vence
export const getInviteDeadline = (days, now = Date.now()) => new Date(now + Number(days) * DAY_MS)

// Prazo do convite é um horário real (agora + N × 24h): mostra data e hora locais
export const formatDeadline = (date) => {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${day} às ${time}`
}

export const INVITATION_STATUS_LABELS = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  recusado: 'Recusado',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
}

export const INVITATION_STATUS_BADGE = {
  pendente: 'warning',
  aceito: 'success',
  recusado: 'default',
  expirado: 'default',
  cancelado: 'default',
}

// Estado inicial do bloco "Convidar fila de espera" no formulário do curso
export const INITIAL_INVITE = { enabled: false, sourceCourseId: '', studentIds: [], days: '' }

// Valida o bloco de convites do formulário. Retorna a mensagem de erro ou ''.
// O backend refaz todas essas validações.
export const getInviteError = (invite, { maxDays, freeSlots, published }) => {
  if (!invite?.enabled) return ''
  if (!published) return 'Os convites só podem ser enviados com o status "Publicado".'
  if (!invite.sourceCourseId) return 'Selecione o curso de origem dos convites.'
  if (!invite.studentIds.length) return 'Selecione ao menos uma pessoa para convidar.'
  if (invite.studentIds.length > freeSlots)
    return `Há ${Math.max(0, freeSlots)} vaga(s) livre(s) para ${invite.studentIds.length} convite(s).`
  if (maxDays == null) return 'Defina o cronograma do curso para calcular o prazo dos convites.'
  if (maxDays < 1) return 'O curso começa em menos de 1 dia, então não há prazo possível para convites.'
  const days = Number(invite.days)
  if (!Number.isInteger(days) || days < 1) return 'Informe o prazo do convite em dias (mínimo de 1 dia).'
  if (days > maxDays) return `O prazo não pode ultrapassar o início do curso (máximo de ${maxDays} dia(s)).`
  return ''
}

// Complementa a mensagem de sucesso ao salvar um curso
export const withInvitations = (message, sent) =>
  sent ? `${message} ${sent} convite(s) enviado(s).` : message
