const MetricCard = ({ label, value, icon: Icon, color = 'text-primary', bg = 'bg-surface-hover' }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-0.5">{value ?? '—'}</p>
    </div>
  </div>
)

export default MetricCard
