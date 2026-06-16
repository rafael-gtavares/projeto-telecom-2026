import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { School } from 'lucide-react'

// Paleta de cores usando as cores do design system
const COLORS = [
  '#1565C0', // primary
  '#42A5F5', // primary-lighter
  '#1976D2', // primary-light
  '#0D47A1', // primary-dark
  '#90CAF9', // azul claro
  '#5C6880', // text-secondary
  '#1A1A2E', // text-primary
  '#9EA8B8', // text-muted
  '#64B5F6',
  '#283593',
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-card shadow-card px-3 py-2">
        <p className="text-sm font-semibold text-text-primary">{payload[0].name}</p>
        <p className="text-sm text-text-secondary">
          {payload[0].value} aluno{payload[0].value !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }
  return null
}

const SchoolChartCard = ({ data }) => {
  // Filtra entradas com count 0 e ordena por quantidade
  const chartData = (data || [])
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count)

  const total = chartData.reduce((acc, d) => acc + d.count, 0)

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-text-primary text-sm">Escola de origem</h3>
        <p className="text-xs text-text-muted">Distribuição por escola — apenas alunos</p>
      </div>

      {(!chartData || chartData.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-40 text-text-muted">
          <School size={28} className="mb-2 opacity-40" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Donut — tamanho fixo, não disputa espaço com a legenda */}
          <div className="w-[180px] h-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={48}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda própria — cada escola em uma linha, com rolagem se houver muitas */}
          <ul className="flex-1 w-full min-w-0 space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-hide">
            {chartData.map((entry, index) => {
              const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0
              return (
                <li key={index} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="flex-1 min-w-0 truncate text-text-secondary" title={entry.name}>
                    {entry.name}
                  </span>
                  <span className="flex-shrink-0 font-semibold text-text-primary tabular-nums">
                    {entry.count}
                  </span>
                  <span className="flex-shrink-0 text-text-muted tabular-nums w-9 text-right">
                    {pct}%
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <p className="text-xs text-text-muted text-center mt-3 pt-3 border-t border-border">
        Total: {total} aluno{total !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export default SchoolChartCard
