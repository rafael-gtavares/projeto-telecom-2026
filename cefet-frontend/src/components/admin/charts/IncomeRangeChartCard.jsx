import StatsBarChart from './StatsBarChart'

const incomeLabels = {
  ate_1sm: 'Até 1 SM',
  '1_a_2sm': '1 a 2 SM',
  '2_a_3sm': '2 a 3 SM',
  '3_a_5sm': '3 a 5 SM',
  acima_5sm: '5+ SM',
  prefiro_nao_informar: 'Não informar'
}

const IncomeRangeChartCard = ({ data }) => {

  const chartData = data
    ? Object.entries(data).map(([key, value]) => ({
        label: incomeLabels[key],
        count: value
      }))
    : []

  return (
    <div className="card p-5">

      <h3 className="font-semibold text-text-primary text-sm mb-1">
        Faixa de renda
      </h3>

      <p className="text-xs text-text-muted">
        Inscrições no período selecionado
      </p>

      <StatsBarChart data={chartData} />
    </div>
  )
}

export default IncomeRangeChartCard