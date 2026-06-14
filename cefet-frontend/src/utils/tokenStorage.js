// Tokens em localStorage — compartilhado entre todas as abas do navegador
// A duração da sessão é controlada no backend pelo "Lembrar-me" (30d vs ~1d),
// não pelo local de armazenamento.

const ACCESS = 'accessToken'
const REFRESH = 'refreshToken'

export const setTokens = ({ accessToken, refreshToken }) => {
  localStorage.setItem(ACCESS, accessToken)
  localStorage.setItem(REFRESH, refreshToken)
}

// Atualiza só o access token (após renovar via refresh)
export const setAccessToken = (accessToken) => localStorage.setItem(ACCESS, accessToken)

export const getAccessToken = () => localStorage.getItem(ACCESS)
export const getRefreshToken = () => localStorage.getItem(REFRESH)

export const clearTokens = () => {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}
