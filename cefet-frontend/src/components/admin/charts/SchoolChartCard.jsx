import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-text-secondary">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          <p className="text-xs text-text-muted text-center mt-1">
            Total: {total} aluno{total !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  )
}

export default SchoolChartCard
