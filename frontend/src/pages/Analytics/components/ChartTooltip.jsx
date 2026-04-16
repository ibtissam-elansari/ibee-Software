export const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 text-white rounded-xl px-3 py-2 text-xs shadow-xl min-w-[110px]">
      <p className="text-gray-400 mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {unit ? `${p.value}${unit}` : p.value}
        </p>
      ))}
    </div>
  )
}