import StatsBarChart from './StatsBarChart'

const EnrollmentChartCard = ({ data }) => {

  const chartData = data?.map(item => ({
    label: item.month,
    count: item.count
  }))

  return (
    <div className="card p-5">

      <h3 className="font-semibold text-text-primary text-sm mb-1">
        Inscrições por mês
      </h3>

      <p className="text-xs text-text-muted">
        Últimos 6 meses
      </p>

      <StatsBarChart data={chartData} />
    </div>
  )
}

export default EnrollmentChartCard