// components/charts/VolumeTimeline.jsx
import React from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

const VolumeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const urgente   = payload.find(p => p.dataKey === 'urgente')?.value   ?? 0
  const attention = payload.find(p => p.dataKey === 'attention')?.value ?? 0
  const total     = urgente + attention
  if (total === 0) return null
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-[140px]">
      <p className="text-gray-400 text-[10px] mb-1">{label}</p>
      <p className="font-bold text-base mb-2">{total} alertes</p>
      <div className="flex flex-col gap-1.5 border-t border-white/10 pt-2">
        {urgente > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
              <span className="text-gray-300">Urgentes</span>
            </div>
            <span className="font-semibold">{urgente}</span>
          </div>
        )}
        {attention > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
              <span className="text-gray-300">Attention</span>
            </div>
            <span className="font-semibold">{attention}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * VolumeTimeline — stacked area by importance level.
 *
 * Props:
 *   data    { date, total, urgente, attention }[]
 *   height  number
 *   loading bool
 */
const VolumeTimeline = ({ data = [], height = 180, loading = false }) => {
  if (loading) {
    return <div style={{ height }} className="bg-gray-50 rounded-xl animate-pulse" />
  }
  if (!data.length || data.every(d => d.total === 0)) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-gray-300 bg-gray-50 rounded-xl"
      >
        Aucune alerte sur cette période
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Legend */}
      <div className="absolute top-0 right-0 flex items-center gap-3 z-10">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-sm" style={{ background: '#FCA5A5' }} />
          Urgente
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-sm" style={{ background: '#FDE68A' }} />
          Attention
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} stackOffset="none">
          <defs>
            <linearGradient id="grad-urgente" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="grad-attention" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
          <Tooltip content={<VolumeTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
          <Area
            type="monotone" dataKey="attention"
            stackId="imp"
            stroke="#F59E0B" strokeWidth={1.5}
            fill="url(#grad-attention)"
            dot={false}
            activeDot={{ r: 4, fill: '#F59E0B', stroke: 'white', strokeWidth: 2 }}
          />
          <Area
            type="monotone" dataKey="urgente"
            stackId="imp"
            stroke="#EF4444" strokeWidth={1.5}
            fill="url(#grad-urgente)"
            dot={false}
            activeDot={{ r: 4, fill: '#EF4444', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default VolumeTimeline