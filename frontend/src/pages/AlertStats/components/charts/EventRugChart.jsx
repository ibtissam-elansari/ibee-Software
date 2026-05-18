// components/charts/EventRugChart.jsx
import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const EventTooltip = ({ active, payload, label, color, label: typeLabel }) => {
  if (!active || !payload?.length) return null
  const count = payload[0]?.value ?? 0
  if (count === 0) return null
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-gray-400 text-[10px] mb-1">{label}</p>
      <p className="font-bold text-sm" style={{ color }}>
        {count} événement{count > 1 ? 's' : ''}
      </p>
    </div>
  )
}

/**
 * EventRugChart — bar chart for discrete security/sound events.
 * Uses a thin bar chart so each day clearly shows event count.
 *
 * Props:
 *   data    { date, count }[]
 *   color   hex
 *   height  number
 *   loading bool
 */
const EventRugChart = ({ data = [], color = '#2563EB', height = 100, loading = false }) => {
  if (loading) {
    return <div style={{ height }} className="bg-gray-50 rounded-xl animate-pulse" />
  }
  if (!data.length || data.every(d => d.count === 0)) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-gray-300 bg-gray-50 rounded-xl"
      >
        Aucun événement
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }} barCategoryGap="40%">
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false} tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<EventTooltip color={color} />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Bar dataKey="count" fill={color} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default EventRugChart