import { useMemo } from 'react'
import StatsBarChart from './StatsBarChart'

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

const PERIOD_CONFIG = {
  '1m': { months: 1, label: 'Último mês' },
  '3m': { months: 3, label: 'Últimos 3 meses' },
  '6m': { months: 6, label: 'Últimos 6 meses' },
  '1y': { months: 12, label: 'Último ano' }
}

const EnrollmentChartCard = ({ data = [], period = '6m' }) => {
  const { months: monthsToShow, label: periodLabel } = PERIOD_CONFIG[period] || PERIOD_CONFIG['6m']

  const chartData = useMemo(() => {
    const now = new Date()

    const labels = Array.from({ length: monthsToShow }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (monthsToShow - 1 - index), 1)
      return MONTH_NAMES[date.getMonth()]
    })

    const countsMap = data.reduce((acc, item) => {
      acc[item.month] = item.count
      return acc
    }, {})

    return labels.map(label => ({
      label,
      count: countsMap[label] ?? 0
    }))
  }, [data, monthsToShow])

  return (
    <div className="card p-5">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-text-primary text-sm mb-1">Inscrições por mês</h3>
          <p className="text-xs text-text-muted">{periodLabel}</p>
        </div>
      </div>

      <StatsBarChart data={chartData} />
    </div>
  )
}

export default EnrollmentChartCard