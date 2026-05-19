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

      <h3 className="font-semibold text-text-primary text-sm mb-1">
        Escolaridade
      </h3>

      <p className="text-xs text-text-muted">
        Inscrições no período selecionado
      </p>

      <StatsBarChart data={chartData} />
    </div>
  )
}

export default SchoolLevelChartCard