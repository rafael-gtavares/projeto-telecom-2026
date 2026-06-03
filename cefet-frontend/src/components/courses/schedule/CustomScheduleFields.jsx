import { Plus, Trash2 } from 'lucide-react'
import Input from '../../ui/Input'

const CustomScheduleFields = ({ config = [], onChange }) => {
  const addDate = () => {
    const template = config[config.length - 1] || { startTime: '', endTime: '' }
    onChange([...config, { date: '', startTime: template.startTime, endTime: template.endTime }])
  }

  const removeDate = (idx) => onChange(config.filter((_, i) => i !== idx))

  const setItem = (idx, key) => (e) =>
    onChange(config.map((item, i) => i === idx ? { ...item, [key]: e.target.value } : item))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-secondary">Datas das aulas *</label>
        <button
          type="button"
          onClick={addDate}
          className="flex items-center gap-1 text-xs font-semibold text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/5 border border-primary/20 transition-colors"
        >
          <Plus size={13} /> Adicionar data
        </button>
      </div>

      {config.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-border rounded-xl text-text-muted text-sm">
          Clique em "Adicionar data" para começar.
        </div>
      )}

      <div className="space-y-2">
        {config.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl border border-border">
            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {idx + 1}
            </span>
            <div className="grid grid-cols-3 gap-2 flex-1">
              <Input label="Data"   type="date" value={item.date}      onChange={setItem(idx, 'date')}      />
              <Input label="Início" type="time" value={item.startTime} onChange={setItem(idx, 'startTime')} />
              <Input label="Fim"    type="time" value={item.endTime}   onChange={setItem(idx, 'endTime')}   />
            </div>
            <button
              type="button"
              onClick={() => removeDate(idx)}
              disabled={config.length === 1}
              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors disabled:opacity-30 flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CustomScheduleFields