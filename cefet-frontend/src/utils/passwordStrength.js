export const passwordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const levels = [
    { label: 'Muito fraca', color: 'bg-error' },
    { label: 'Fraca', color: 'bg-orange-400' },
    { label: 'Regular', color: 'bg-warning' },
    { label: 'Boa', color: 'bg-yellow-400' },
    { label: 'Forte', color: 'bg-success' },
  ]
  return { score, ...levels[score] }
}
