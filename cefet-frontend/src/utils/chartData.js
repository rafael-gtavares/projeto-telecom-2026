export const genderLabels = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  prefiro_nao_informar: 'Não informar'
}

export const incomeLabels = {
  ate_1sm: 'Até 1 SM',
  '1_a_2sm': '1 a 2 SM',
  '2_a_3sm': '2 a 3 SM',
  '3_a_5sm': '3 a 5 SM',
  acima_5sm: 'Acima de 5 SM',
  prefiro_nao_informar: 'Não informar'
}

export const schoolLabels = {
  ensino_fundamental: 'Fundamental',
  '1_ou_2_ano_em': '1º/2º EM',
  ultimo_ano_em: '3º EM',
  ensino_medio_finalizado: 'EM Finalizado',
  eja: 'EJA'
}

export const ageLabels = {
  ate_14: 'Até 14',
  de_15_a_17: '15-17',
  de_18_a_21: '18-21',
  de_22_a_25: '22-25',
  acima_de_25: '25+'
}


// ======================================================
// CONVERTER OBJETO EM ARRAY PARA GRÁFICOS
// ======================================================

export const formatChartData = (
  data,
  labels
) => {

  if (!data) return []

  return Object.entries(data).map(([key, value]) => ({
    label: labels[key] || key,
    count: value
  }))
}