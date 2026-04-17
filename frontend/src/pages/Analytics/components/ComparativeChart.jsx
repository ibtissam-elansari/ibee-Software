import React from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { METRIC_CONFIG } from '../config/metricConfig'

const LINES = ['temperature', 'humidity', 'sound'].map(k => ({
  key   : METRIC_CONFIG[k].chartKey,
  color : METRIC_CONFIG[k].chartColor,
}))

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 text-white rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-[120px]">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.value}
        </p>
      ))}
    </div>
  )
}

// Custom legend that shows the full key name (which already includes the unit)
const CustomLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-6 pt-4">
    {payload.map(entry => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-xs text-gray-500">{entry.value}</span>
      </div>
    ))}
  </div>
)

const ComparativeChart = ({ data, isLoading }) => {
  if (isLoading) return (
    <div className="h-72 bg-gray-50 rounded-xl animate-pulse" />
  )
  if (!data?.length) return (
    <div className="h-72 flex items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-300">
      Pas encore de données pour cette période
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="rgba(0,0,0,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Legend content={<CustomLegend />} />
        {LINES.map(({ key, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls
            activeDot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default ComparativeChart