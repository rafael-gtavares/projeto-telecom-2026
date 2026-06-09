import StatsBarChart from './StatsBarChart'

const ageLabels = {
  ate_14: 'Até 14',
  de_15_a_17: '15-17',
  de_18_a_21: '18-21',
  de_22_a_25: '22-25',
  acima_de_25: '25+'
}

const AgeChartCard = ({ data }) => {

  const chartData = data
    ? Object.entries(data).map(([key, value]) => ({
        label: ageLabels[key],
        count: value
      }))
    : []

  return (
    <div className="card p-5">

      <h3 className="font-semibold text-text-primary text-sm">
        Distribuição por idade
      </h3>

      <StatsBarChart data={chartData} />
    </div>
  )
}

export default AgeChartCard