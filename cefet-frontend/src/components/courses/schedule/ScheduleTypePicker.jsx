import { Calendar, RefreshCw, ListChecks } from 'lucide-react'

const OPTIONS = [
  { value: 'single',  label: 'Aula única',      desc: 'Uma única data e horário', icon: Calendar    },
  { value: 'weekly',  label: 'Semanal',          desc: 'Recorrente por semana',    icon: RefreshCw   },
  { value: 'custom',  label: 'Personalizado',    desc: 'Datas específicas avulsas',icon: ListChecks  },
]

const ScheduleTypePicker = ({ value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-text-secondary mb-2">
      Tipo de agenda
    </label>
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ value: opt, label, desc, icon: Icon }) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all
              ${active
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-white text-text-secondary hover:border-primary/40 hover:bg-surface-hover'
              }`}
          >
            <Icon size={18} className={active ? 'text-primary' : 'text-text-muted'} />
            <span className="text-xs font-semibold leading-tight">{label}</span>
            <span className="text-[10px] text-text-muted leading-tight">{desc}</span>
          </button>
        )
      })}
    </div>
  </div>
)

export default ScheduleTypePicker