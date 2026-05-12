import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { METRIC_CONFIG } from '../config/metricConfig'

// Per-sensor Y-axis config
const AXIS_CONFIG = {
  temperature : { id: 'temp',   side: 'left',  domain: [28, 50],      fmt: v => `${v}°C`,  width: 42 },
  humidity    : { id: 'hum',    side: 'left',  domain: [0, 100],      fmt: v => `${v}%`,   width: 36 },
  sound       : { id: 'sound',  side: 'right', domain: [0, 220],      fmt: v => `${v}Hz`,  width: 46 },
  weight      : { id: 'weight', side: 'right', domain: ['auto','auto'],fmt: v => `${v}kg`,  width: 46 },
}

function makeTickFormatter(dataLength, maxLabels = 8) {
  const step = Math.max(1, Math.ceil(dataLength / maxLabels))
  return (value, index) => index % step === 0 ? value : ''
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  // Only show lines that are currently visible (not hidden)
  const visible = payload.filter(p => p.value != null)
  if (!visible.length) return null
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3.5 py-2.5 text-xs
                    shadow-2xl min-w-[150px] border border-white/10">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {visible.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }} className="font-semibold">
            {p.name.split(' (')[0]}
          </span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const CustomLegend = ({ payload, hidden, onToggle }) => (
  <div className="flex items-center justify-center gap-3 sm:gap-5 pt-3 flex-wrap">
    {(payload ?? []).map(entry => {
      const isHidden = hidden.includes(entry.dataKey)
      return (
        <button
          key={entry.value}
          onClick={() => onToggle(entry.dataKey)}
          className="flex items-center gap-1.5 transition-opacity duration-150"
          style={{ opacity: isHidden ? 0.3 : 1 }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: isHidden ? '#D1D5DB' : entry.color }} />
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

  const toggle = (dataKey) =>
    setHidden(prev =>
      prev.includes(dataKey) ? prev.filter(k => k !== dataKey) : [...prev, dataKey]
    )

  const tickFormatter = useMemo(
    () => makeTickFormatter(data?.length ?? 0, 8),
    [data?.length]
  )

  // Compute weight domain from actual data so axis fits tightly
  const weightDomain = useMemo(() => {
    const wKey = METRIC_CONFIG.weight.chartKey
    const vals = (data ?? []).map(d => d[wKey]).filter(v => v != null)
    if (!vals.length) return ['auto', 'auto']
    const lo  = Math.min(...vals)
    const hi  = Math.max(...vals)
    const pad = Math.max((hi - lo) * 0.15, 0.5)
    return [parseFloat((lo - pad).toFixed(1)), parseFloat((hi + pad).toFixed(1))]
  }, [data])

  if (isLoading) return (
    <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse" />
  )
  if (!data?.length) return (
    <div className="w-full h-full flex items-center justify-center
                    bg-gray-50 rounded-xl text-sm text-gray-300">
      Pas encore de données pour cette période
    </div>
  )

  const weightKey = METRIC_CONFIG.weight.chartKey
  const hasWeight = data.some(d => d[weightKey] != null)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 8, right: hasWeight ? 52 : 8, left: 40, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />

        {/* interval={0} = every point hoverable; formatter hides most labels */}
        <XAxis
          dataKey="time"
          interval={0}
          tickFormatter={tickFormatter}
          tick={{ fontSize: 9, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />

        {/* Temperature axis — left, 28–50°C */}
        <YAxis
          yAxisId="temp"
          orientation="left"
          domain={[28, 50]}
          ticks={[28, 32, 36, 40, 44, 48]}
          tick={{ fontSize: 9, fill: METRIC_CONFIG.temperature.chartColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}°C`}
          width={42}
          hide={hidden.includes(METRIC_CONFIG.temperature.chartKey)}
        />

        {/* Humidity axis — also left but independent, shown only when temp hidden */}
        <YAxis
          yAxisId="hum"
          orientation="left"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fontSize: 9, fill: METRIC_CONFIG.humidity.chartColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
          width={36}
          hide={
            hidden.includes(METRIC_CONFIG.humidity.chartKey)
          }
        />

        {/* Sound axis — right */}
        <YAxis
          yAxisId="sound"
          orientation="right"
          domain={[0, 220]}
          ticks={[0, 55, 110, 165, 220]}
          tick={{ fontSize: 9, fill: METRIC_CONFIG.sound.chartColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}Hz`}
          width={44}
          hide={hidden.includes(METRIC_CONFIG.sound.chartKey)}
        />

        {/* Weight axis — right (only when data exists) */}
        {hasWeight && (
          <YAxis
            yAxisId="weight"
            orientation="right"
            domain={weightDomain}
            tick={{ fontSize: 9, fill: METRIC_CONFIG.weight.chartColor }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}kg`}
            width={44}
            hide={hidden.includes(METRIC_CONFIG.weight.chartKey)}
          />
        )}

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
        />

        <Legend
          content={(props) =>
            <CustomLegend {...props} hidden={hidden} onToggle={toggle} />
          }
        />

        {/* Temperature */}
        <Line
          yAxisId="temp"
          type="monotone"
          dataKey={METRIC_CONFIG.temperature.chartKey}
          stroke={METRIC_CONFIG.temperature.chartColor}
          strokeWidth={2}
          dot={false}
          connectNulls
          hide={hidden.includes(METRIC_CONFIG.temperature.chartKey)}
          activeDot={{ r: 5, fill: METRIC_CONFIG.temperature.chartColor, stroke: 'white', strokeWidth: 2 }}
        />

        {/* Humidity */}
        <Line
          yAxisId="hum"
          type="monotone"
          dataKey={METRIC_CONFIG.humidity.chartKey}
          stroke={METRIC_CONFIG.humidity.chartColor}
          strokeWidth={2}
          dot={false}
          connectNulls
          hide={hidden.includes(METRIC_CONFIG.humidity.chartKey)}
          activeDot={{ r: 5, fill: METRIC_CONFIG.humidity.chartColor, stroke: 'white', strokeWidth: 2 }}
        />

        {/* Sound */}
        <Line
          yAxisId="sound"
          type="monotone"
          dataKey={METRIC_CONFIG.sound.chartKey}
          stroke={METRIC_CONFIG.sound.chartColor}
          strokeWidth={2}
          dot={false}
          connectNulls
          hide={hidden.includes(METRIC_CONFIG.sound.chartKey)}
          activeDot={{ r: 5, fill: METRIC_CONFIG.sound.chartColor, stroke: 'white', strokeWidth: 2 }}
        />

        {/* Weight */}
        {hasWeight && (
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey={METRIC_CONFIG.weight.chartKey}
            stroke={METRIC_CONFIG.weight.chartColor}
            strokeWidth={2.5}
            dot={false}
            connectNulls
            hide={hidden.includes(METRIC_CONFIG.weight.chartKey)}
            activeDot={{ r: 5, fill: METRIC_CONFIG.weight.chartColor, stroke: 'white', strokeWidth: 2 }}
          />
        )}

      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default ComparativeChart