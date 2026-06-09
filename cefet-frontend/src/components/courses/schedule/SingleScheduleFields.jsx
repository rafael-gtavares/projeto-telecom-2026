import Input from '../../ui/Input'

const SingleScheduleFields = ({ config, onChange }) => {
  const set = (key) => (e) => onChange({ ...config, [key]: e.target.value })

  return (
    <div className="space-y-4">
      <Input
        label="Data da aula *"
        type="date"
        value={config.date || ''}
        onChange={set('date')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Hora de início *"
          type="time"
          value={config.startTime || ''}
          onChange={set('startTime')}
        />
        <Input
          label="Hora de término *"
          type="time"
          value={config.endTime || ''}
          onChange={set('endTime')}
        />
      </div>
    </div>
  )
}

export default SingleScheduleFields