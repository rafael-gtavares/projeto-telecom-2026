import { useState, useEffect } from 'react'
import { Eye, Users, Activity, UserPlus, Loader2, AlertCircle, LogIn } from 'lucide-react'
import MetricCard from '../MetricCard'
import { getAccessStatsAPI } from '../../../api/usage'

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
]

const fmtDay = (iso) => { const [, m, d] = iso.split('-'); return `${d}/${m}` }

// Gráfico de barras diário: parte sólida = logados, parte clara = anônimos.
const AccessTrendChart = ({ series }) => {
  if (!series?.length) return null
  const max = Math.max(...series.map((d) => d.total), 1)
  const step = Math.max(1, Math.ceil(series.length / 8))

  return (
    <div>
      <div className="flex items-end gap-[2px] h-40">
        {series.map((d) => (
          <div
            key={d.date}
            className="flex-1 min-w-0 h-full flex items-end"
            title={`${fmtDay(d.date)} — ${d.total} acessos (${d.loggedIn} logados)`}
          >
            <div
              className="w-full bg-primary/20 rounded-t-sm relative overflow-hidden"
              style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total ? 3 : 0 }}
            >
              <div
                className="absolute bottom-0 inset-x-0 bg-primary"
                style={{ height: `${d.total ? (d.loggedIn / d.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-text-muted">
        {series.filter((_, i) => i % step === 0).map((d) => <span key={d.date}>{fmtDay(d.date)}</span>)}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Logados</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary/20" /> Anônimos</span>
      </div>
    </div>
  )
}

// Seção "Acessos ao site" do dashboard admin.
const SiteAccessSection = () => {
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true); setError(false)
    getAccessStatsAPI(period)
      .then(({ data }) => { if (active) setData(data.data) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [period])

  const loggedPct = data && data.totalViews > 0
    ? Math.round((data.loggedInViews / data.totalViews) * 100)
    : 0

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Acessos ao site</h2>
          <p className="text-sm text-text-muted">Quantas pessoas estão acessando a plataforma</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Período</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          >
            {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-text-muted" />
        </div>
      ) : error ? (
        <div className="card flex flex-col items-center justify-center py-14 text-center">
          <AlertCircle size={32} className="text-error mb-2" />
          <p className="text-sm text-text-muted">Não foi possível carregar as estatísticas de acesso.</p>
        </div>
      ) : (
        <>
          {/* Cards de destaque */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Acessos" value={data.totalViews} icon={Eye} />
            <MetricCard label="Visitantes únicos" value={data.uniqueVisitors} icon={Users}
              bg="bg-success-light" color="text-success" />
            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center flex-shrink-0 relative">
                <Activity size={22} className="text-success" />
                <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                </span>
              </div>
              <div>
                <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Ativos agora</p>
                <p className="text-2xl font-bold text-text-primary mt-0.5">{data.activeNow}</p>
                <p className="text-[11px] text-text-muted">{data.activeUsersNow} logados · últimos 5 min</p>
              </div>
            </div>
            <MetricCard label="Novos cadastros" value={data.newUsers} icon={UserPlus}
              bg="bg-warning-light" color="text-warning" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Gráfico de acessos por dia */}
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">Acessos por dia</h3>
                  <p className="text-xs text-text-muted">Logados vs. anônimos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                    <LogIn size={13} /> {loggedPct}% logados
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {data.loggedInViews} logados · {data.anonymousViews} anônimos
                  </p>
                </div>
              </div>
              <AccessTrendChart series={data.series} />
            </div>

            {/* Páginas mais acessadas */}
            <div className="card p-5">
              <h3 className="font-semibold text-text-primary text-sm mb-3">Páginas mais acessadas</h3>
              {data.topPages.length === 0 ? (
                <p className="text-sm text-text-muted py-6 text-center">Sem dados ainda.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topPages.map((p) => {
                    const pct = data.topPages[0].count ? (p.count / data.topPages[0].count) * 100 : 0
                    return (
                      <div key={p.path}>
                        <div className="flex items-center justify-between text-xs mb-0.5 gap-2">
                          <span className="text-text-secondary truncate font-mono">{p.path}</span>
                          <span className="text-text-muted flex-shrink-0">{p.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-page overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SiteAccessSection
