import React from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { METRIC_CONFIG } from '../config/metricConfig'

function calcInterval(dataLength, maxTicks = 8) {
  if (dataLength <= maxTicks) return 0
  return Math.ceil(dataLength / maxTicks) - 1
}

const AlertDot = (props) => {
  const { cx, cy, payload, alertY } = props
  if (payload?.value == null || alertY == null) return null
  if (payload.value < alertY) return null
  return <circle cx={cx} cy={cy} r={4} fill="#EF4444" stroke="white" strokeWidth={1.5} />
}

const MetricDetailChart = ({ data, metric, unit, isLoading }) => {
  const cfg    = METRIC_CONFIG[metric] ?? METRIC_CONFIG.temperature
  const color  = cfg.chartColor
  const alertY = cfg.alertThreshold != null ? cfg.scale(cfg.alertThreshold) : null

  if (isLoading) return (
    <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse" />
  )
  if (!data?.length) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-300">
      Pas encore de données
    </div>
  )

  const interval = calcInterval(data.length, 8)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="time"
          interval={interval}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}${unit}`}
          width={52}
        />
        {alertY != null && (
          <ReferenceLine
            y={alertY}
            stroke="#FCA5A5"
            strokeDasharray="5 3"
            strokeWidth={1.5}
            label={{ value: 'Seuil alerte', position: 'insideTopRight', fontSize: 9, fill: '#F87171', fontWeight: 600 }}
          />
        )}
        <Tooltip
          content={<ChartTooltip unit={unit} />}
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Line
          type="monotoneX"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          connectNulls
          dot={alertY != null ? <AlertDot alertY={alertY} /> : false}
          activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default MetricDetailChart