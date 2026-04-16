import React from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { METRIC_CONFIG } from '../config/metricConfig'

const LINES = ['temperature', 'humidity', 'sound'].map(k => ({
  key   : METRIC_CONFIG[k].chartKey,
  color : METRIC_CONFIG[k].chartColor,
}))

const ComparativeChart = ({ data, isLoading }) => {
  if (isLoading) return (
    <div className="h-72 bg-gray-50 rounded-xl animate-pulse mt-4" />
  )
  if (!data?.length) return (
    <div className="h-72 flex items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-300 mt-4">
      Pas encore de données
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
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
          content={<ChartTooltip />}
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
          iconType="circle"
          iconSize={8}
        />
        {LINES.map(({ key, color }) => (
          <Line
            key={key}
            type="monotoneX"
            dataKey={key}
            stroke={color}
            strokeWidth={2.5}
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