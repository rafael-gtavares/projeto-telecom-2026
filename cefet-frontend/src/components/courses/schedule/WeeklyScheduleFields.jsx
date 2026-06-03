import Input from '../../ui/Input'

const WEEKDAYS = [
  { value: 0, short: 'Dom' },
  { value: 1, short: 'Seg' },
  { value: 2, short: 'Ter' },
  { value: 3, short: 'Qua' },
  { value: 4, short: 'Qui' },
  { value: 5, short: 'Sex' },
  { value: 6, short: 'Sáb' },
]

const WeeklyScheduleFields = ({ config, onChange }) => {
  const { startDate = '', endDate = '', weekdays = [] } = config

  const setField = (key) => (e) => onChange({ ...config, [key]: e.target.value })

  const toggleWeekday = (day) => {
    const already = weekdays.find((w) => w.weekday === day)
    if (already) {
      onChange({ ...config, weekdays: weekdays.filter((w) => w.weekday !== day) })
    } else {
      const template = weekdays[0] || { startTime: '', endTime: '' }
      const updated = [...weekdays, { weekday: day, startTime: template.startTime, endTime: template.endTime }]
      onChange({ ...config, weekdays: updated.sort((a, b) => a.weekday - b.weekday) })
    }
  }

  const setWeekdayTime = (day, key) => (e) =>
    onChange({
      ...config,
      weekdays: weekdays.map((w) => w.weekday === day ? { ...w, [key]: e.target.value } : w),
    })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Data de início *" type="date" value={startDate} onChange={setField('startDate')} />
        <Input label="Data de término *" type="date" value={endDate}   onChange={setField('endDate')}   />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Dias da semana *</label>
        <div className="flex gap-1.5">
          {WEEKDAYS.map(({ value, short }) => {
            const active = weekdays.some((w) => w.weekday === value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleWeekday(value)}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all
                  ${active
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-hover text-text-secondary hover:bg-primary/10 hover:text-primary border border-border'
                  }`}
              >
                {short}
              </button>
            )
          })}
        </div>
      </div>

      {weekdays.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Horários por dia</p>
          {weekdays.map(({ weekday, startTime, endTime }) => {
            const label = WEEKDAYS.find((w) => w.value === weekday)?.short
            return (
              <div key={weekday} className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl border border-border">
                <span className="w-8 h-8 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {label}
                </span>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <Input label="Início" type="time" value={startTime} onChange={setWeekdayTime(weekday, 'startTime')} />
                  <Input label="Fim"    type="time" value={endTime}   onChange={setWeekdayTime(weekday, 'endTime')}   />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default WeeklyScheduleFields