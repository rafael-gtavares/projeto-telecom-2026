const StatsBarChart = ({ data }) => {

  if (!data?.length) return null

  const max = Math.max(...data.map(item => item.count), 1)

  return (
    <div className="flex items-end gap-2 h-32 mt-4">

      {data.map(({ label, count }) => (

        <div
          key={label}
          className="flex-1 flex flex-col items-center gap-1"
        >

          <span className="text-xs text-text-muted">
            {count}
          </span>

          <div
            className="w-full bg-surface-hover rounded-t-sm relative"
            style={{
              height: `${(count / max) * 96}px`,
              minHeight: 4
            }}
          >
            <div className="absolute inset-0 bg-primary rounded-t-sm opacity-80" />
          </div>

          <span className="text-[10px] text-text-muted text-center whitespace-nowrap">
            {label}
          </span>

        </div>
      ))}
    </div>
  )
}

export default StatsBarChart