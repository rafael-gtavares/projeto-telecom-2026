import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { recordVisitAPI } from '../../api/usage'
import { getVisitorId } from '../../utils/clientId'

// Registra um acesso a cada mudança de rota (envia só o pathname — sem query,
// para não vazar dados em parâmetros de URL). Best-effort: falhas são ignoradas.
// Nome neutro de propósito: bloqueadores de anúncios barram caminhos com
// "analytics"/"tracker"/"pageview", o que quebraria o import do módulo.
const VisitLogger = () => {
  const { pathname } = useLocation()
  const last = useRef({ path: null, t: 0 })

  useEffect(() => {
    const now = Date.now()
    // Dedupe (StrictMode / re-render): ignora repetição do mesmo path em < 1s
    if (last.current.path === pathname && now - last.current.t < 1000) return
    last.current = { path: pathname, t: now }

    recordVisitAPI(pathname, getVisitorId()).catch(() => {})
  }, [pathname])

  return null
}

export default VisitLogger
