import StatsBarChart from './StatsBarChart'

const schoolLabels = {
  ensino_fundamental: 'Fundamental',
  '1_ou_2_ano_em': '1º/2º EM',
  ultimo_ano_em: '3º EM',
  ensino_medio_finalizado: 'EM Finalizado',
  eja: 'EJA'
}

const SchoolLevelChartCard = ({ data }) => {

  const chartData = data
    ? Object.entries(data).map(([key, value]) => ({
        label: schoolLabels[key],
        count: value
      }))
    : []

  return (
    <div className="card p-5">

      <h3 className="font-semibold text-text-primary text-sm">
        Escolaridade
      </h3>

      <StatsBarChart data={chartData} />
    </div>
  )
}

export default SchoolLevelChartCard