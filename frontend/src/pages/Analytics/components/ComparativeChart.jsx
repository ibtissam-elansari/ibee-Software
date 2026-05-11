import React, { useState } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { METRIC_CONFIG } from '../config/metricConfig'

const LEFT_LINES = ['temperature', 'humidity', 'sound']

function calcInterval(dataLength, maxTicks = 8) {
  if (dataLength <= maxTicks) return 0
  return Math.ceil(dataLength / maxTicks) - 1
}

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

const CustomLegend = ({ payload, hidden, onToggle }) => (
  <div className="flex items-center justify-center gap-3 sm:gap-5 pt-3 flex-wrap">
    {payload.map(entry => {
      const isHidden = hidden.includes(entry.dataKey)
      return (
        <button
          key={entry.value}
          onClick={() => onToggle(entry.dataKey)}
          className="flex items-center gap-1.5 transition-opacity duration-150"
          style={{ opacity: isHidden ? 0.3 : 1 }}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: isHidden ? '#D1D5DB' : entry.color }}
          />
          <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
            {entry.value.split(' (')[0]}
          </span>
        </button>
      )
    })}
  </div>
)

const ComparativeChart = ({ data, isLoading }) => {
  const [hidden, setHidden] = useState([])

  const toggle = (dataKey) => {
    setHidden(prev =>
      prev.includes(dataKey) ? prev.filter(k => k !== dataKey) : [...prev, dataKey]
    )
  }

  if (isLoading) return <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse" />
  if (!data?.length) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-300">
      Pas encore de données pour cette période
    </div>
  )

  const weightKey = METRIC_CONFIG.weight.chartKey
  const hasWeight = data.some(d => d[weightKey] != null)
  const interval  = calcInterval(data.length, 8)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: hasWeight ? 36 : 8, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="time"
          interval={interval}
          tick={{ fontSize: 9, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fontSize: 9, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        {hasWeight && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 9, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}kg`}
            width={36}
          />
        )}
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Legend content={(props) => <CustomLegend {...props} hidden={hidden} onToggle={toggle} />} />

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
              hide={hidden.includes(cfg.chartKey)}
              activeDot={{ r: 5, fill: cfg.chartColor, stroke: 'white', strokeWidth: 2 }}
            />
          )
        })}

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
              dot={false}
              connectNulls
              hide={hidden.includes(cfg.chartKey)}
              activeDot={{ r: 5, fill: cfg.chartColor, stroke: 'white', strokeWidth: 2 }}
            />
          )
        })()}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default ComparativeChart