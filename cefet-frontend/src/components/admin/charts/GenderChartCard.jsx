import StatsBarChart from './StatsBarChart'

const genderLabels = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  prefiro_nao_informar: 'Não informar'
}

const GenderChartCard = ({ data }) => {

  const chartData = data
    ? Object.entries(data).map(([key, value]) => ({
        label: genderLabels[key],
        count: value
      }))
    : []

  return (
    <div className="card p-5">

      <h3 className="font-semibold text-text-primary text-sm">
        Distribuição por sexo
      </h3>

      <StatsBarChart data={chartData} />
    </div>
  )
}

export default GenderChartCard