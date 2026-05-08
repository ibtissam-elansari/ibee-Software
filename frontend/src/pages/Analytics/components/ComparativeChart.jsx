import React from 'react'
import {
  ResponsiveContainer, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { METRIC_CONFIG } from '../config/metricConfig'

const LEFT_LINES = ['temperature', 'humidity', 'sound']

/**
 * Pick an interval so that at most ~maxTicks labels appear on the X axis.
 * interval=0 means "show every tick", interval=1 "show every other", etc.
 */
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

const CustomLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-3 sm:gap-5 pt-3 flex-wrap">
    {payload.map(entry => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
        <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
          {entry.value.split(' (')[0]}
        </span>
      </div>
    ))}
  </div>
)

const ComparativeChart = ({ data, isLoading }) => {
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
      <ComposedChart data={data} margin={{ top: 8, right: hasWeight ? 36 : 8, left: -16, bottom: 0 }}>
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
        <Legend content={<CustomLegend />} />

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
              activeDot={{ r: 5, fill: cfg.chartColor, stroke: 'white', strokeWidth: 2 }}
            />
          )
        })()}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default ComparativeChart