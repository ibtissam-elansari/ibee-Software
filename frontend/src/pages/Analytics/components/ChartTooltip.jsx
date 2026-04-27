export const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3.5 py-2.5 text-xs shadow-2xl min-w-[120px] border border-white/10">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color ?? '#fff' }} className="font-bold">
          {unit ? `${p.value}${unit}` : p.value}
        </p>
      ))}
    </div>
  )
}