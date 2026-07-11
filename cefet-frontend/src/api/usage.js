import api from './axios'

// Nomes de rota neutros ("usage/visit") para não serem barrados por
// bloqueadores de anúncios que filtram "analytics"/"pageview".

// Registra um acesso de página (público — funciona logado ou anônimo)
export const recordVisitAPI = (path, visitorId) =>
  api.post('/usage/visit', { path, visitorId })

// Estatísticas de acesso (admin). period: '7d' | '30d' | '90d'
export const getAccessStatsAPI = (period) =>
  api.get('/usage/access', { params: { period } })
