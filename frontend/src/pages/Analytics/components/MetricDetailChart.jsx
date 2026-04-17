import React from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { METRIC_CONFIG } from '../config/metricConfig'

const MetricDetailChart = ({ data, metric, unit, isLoading, xAxisTicks }) => {
  const cfg   = METRIC_CONFIG[metric] ?? METRIC_CONFIG.temperature
  const color = cfg.chartColor

  if (isLoading) return (
    <div className="h-60 bg-gray-50 rounded-xl animate-pulse" />
  )
  if (!data?.length) return (
    <div className="h-60 flex items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-300">
      Pas encore de données
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis
          dataKey="time"
          ticks={xAxisTicks}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}${unit}`}
          width={50}
        />
        {/* Alert threshold reference line */}
        <ReferenceLine
          y={cfg.scale(cfg.alertThreshold)}
          stroke="#FCA5A5"
          strokeDasharray="4 4"
          strokeWidth={1}
          label={{ value: 'Seuil', position: 'insideTopRight', fontSize: 9, fill: '#FCA5A5' }}
        />
        <Tooltip
          content={<ChartTooltip unit={unit} />}
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Line
          type="monotoneX"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          connectNulls
          activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default MetricDetailChart