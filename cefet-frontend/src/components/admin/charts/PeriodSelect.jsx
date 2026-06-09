const PERIOD_OPTIONS = [
  { value: '1m', label: '1 mês' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 ano' },
]

// Rótulo descritivo do período — usado nos subtítulos das seções
export const PERIOD_LABELS = {
  '1m': 'Último mês',
  '3m': 'Últimos 3 meses',
  '6m': 'Últimos 6 meses',
  '1y': 'Último ano',
}

const PeriodSelect = ({ value, onChange }) => (
  <label className="flex items-center gap-2 text-sm">
    <span className="text-text-muted">Período</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
    >
      {PERIOD_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
)

export default PeriodSelect
