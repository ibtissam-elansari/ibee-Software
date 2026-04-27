import React from 'react'
import {
  ResponsiveContainer, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { METRIC_CONFIG } from '../config/metricConfig'

// Left axis: temperature, humidity, sound (0–100 normalised)
// Right axis: weight in kg (its own scale)
const LEFT_LINES  = ['temperature', 'humidity', 'sound']
const RIGHT_LINES = ['weight']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3.5 py-2.5 text-xs shadow-2xl min-w-[140px] border border-white/10">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span style={{ color: p.color }} className="font-semibold">{p.name.split(' (')[0]}</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const CustomLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-5 pt-3 flex-wrap">
    {payload.map(entry => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
        <span className="text-[11px] text-gray-500 font-medium">{entry.value}</span>
      </div>
    ))}
  </div>
)

const ComparativeChart = ({ data, isLoading, xAxisTicks }) => {
  if (isLoading) return <div className="h-72 bg-gray-50 rounded-xl animate-pulse" />
  if (!data?.length) return (
    <div className="h-72 flex items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-300">
      Pas encore de données pour cette période
    </div>
  )

  // Check if weight data exists in this dataset
  const weightKey  = METRIC_CONFIG.weight.chartKey
  const hasWeight  = data.some(d => d[weightKey] != null)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: hasWeight ? 40 : 16, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="time"
          ticks={xAxisTicks}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        {/* Left Y — 0-100 for temp/hum/sound */}
        <YAxis
          yAxisId="left"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        {/* Right Y — weight in kg, auto-scaled */}
        {hasWeight && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}kg`}
            width={42}
          />
        )}
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Legend content={<CustomLegend />} />

        {/* Left-axis lines */}
        {LEFT_LINES.map(k => {
          const cfg = METRIC_CONFIG[k]
          return (
            <Line
              key={cfg.chartKey}
              yAxisId="left"
              type="monotone"
              dataKey={cfg.chartKey}
              stroke={cfg.chartColor}
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 5, fill: cfg.chartColor, stroke: 'white', strokeWidth: 2 }}
            />
          )
        })}

        {/* Right-axis weight line */}
        {hasWeight && (() => {
          const cfg = METRIC_CONFIG.weight
          return (
            <Line
              key={cfg.chartKey}
              yAxisId="right"
              type="monotone"
              dataKey={cfg.chartKey}
              stroke={cfg.chartColor}
              strokeWidth={2.5}
              strokeDasharray="0"
              dot={false}
              connectNulls
              activeDot={{ r: 5, fill: cfg.chartColor, stroke: 'white', strokeWidth: 2 }}
            />
          )
        })()}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default ComparativeChart