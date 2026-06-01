const getDayName = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T12:00:00');
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[date.getDay()];
};

export default getDayName;