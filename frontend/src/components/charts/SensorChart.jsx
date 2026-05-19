// components/charts/SensorChart.jsx
import React, { useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  ReferenceLine, ReferenceArea, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { SENSOR_THRESHOLDS, TYPE_COLORS, TYPE_LABELS } from '../../hooks/useAlertStats'

// ── Tooltip ───────────────────────────────────────────────────────────────────

const SensorTooltip = ({ active, payload, label, unit, thresholds }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d || d.avg == null) return null

  const isUrgent =
    thresholds?.urgent    != null && d.avg > thresholds.urgent   ? true  :
    thresholds?.low       != null && d.avg < thresholds.low      ? true  : false
  const isWarn =
    !isUrgent && (
      (thresholds?.attention != null && d.avg > thresholds.attention) ||
      (thresholds?.low       != null && d.avg < (thresholds.urgent ?? thresholds.low + 0.3))
    )

  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-[130px]">
      <p className="text-gray-400 text-[10px] mb-1">{label}</p>
      <p className={`font-bold text-base mb-1 ${isUrgent ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'}`}>
        {d.avg}{unit}
      </p>
      {d.min != null && d.max != null && d.min !== d.max && (
        <p className="text-gray-500 text-[10px]">
          {d.min}{unit} – {d.max}{unit}
        </p>
      )}
      {d.count > 0 && (
        <p className="text-red-400 text-[10px] mt-1">⚠ {d.count} alerte{d.count > 1 ? 's' : ''}</p>
      )}
    </div>
  )
}

// ── Dot colored by threshold breach ───────────────────────────────────────────

const ThresholdDot = ({ cx, cy, payload, color, thresholds }) => {
  if (!payload || payload.avg == null) return null

  const urgent =
    (thresholds?.urgent != null && payload.avg > thresholds.urgent) ||
    (thresholds?.low    != null && payload.avg < thresholds.low)

  const warn =
    !urgent && (
      (thresholds?.attention != null && payload.avg > thresholds.attention)
    )

  const fill = urgent ? '#EF4444' : warn ? '#F59E0B' : color

  return (
    <circle
      cx={cx} cy={cy} r={payload.count > 0 ? 4 : 2.5}
      fill={fill}
      stroke={payload.count > 0 ? 'white' : 'none'}
      strokeWidth={payload.count > 0 ? 1.5 : 0}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * SensorChart — continuous sensor with threshold bands.
 *
 * Props:
 *   data        SensorDayStats[] formatted: { date, min, max, avg, count }
 *   sensorType  'temperature' | 'humidity' | 'battery' | 'sound'
 *   color       hex string (TYPE_COLORS[type])
 *   height      number (default 160)
 *   loading     bool
 */
const SensorChart = ({ data = [], sensorType, color, height = 160, loading = false }) => {
  const t = SENSOR_THRESHOLDS[sensorType]

  // Y-axis domain with breathing room
  const domain = useMemo(() => {
    if (!data.length || data.every(d => d.avg == null)) return [t?.min ?? 0, t?.max ?? 100]
    const vals = data.flatMap(d => [d.min, d.max, d.avg].filter(v => v != null))
    const lo   = Math.floor(Math.min(...vals, t?.min ?? Infinity) - 2)
    const hi   = Math.ceil(Math.max(...vals, t?.max ?? -Infinity) + 2)
    return [lo, hi]
  }, [data, t])

  if (loading) {
    return <div style={{ height }} className="bg-gray-50 rounded-xl animate-pulse" />
  }

  if (!data.length || data.every(d => d.avg == null)) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-gray-300 bg-gray-50 rounded-xl"
      >
        Aucune donnée
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${sensorType}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>

        {/* Threshold bands */}
        {t?.urgent != null && (
          <ReferenceArea
            y1={t.urgent} y2={domain[1]}
            fill="rgba(239,68,68,0.06)" ifOverflow="visible"
          />
        )}
        {t?.attention != null && t?.urgent != null && (
          <ReferenceArea
            y1={t.attention} y2={t.urgent}
            fill="rgba(245,158,11,0.05)" ifOverflow="visible"
          />
        )}
        {/* Battery: low band */}
        {t?.low != null && (
          <ReferenceArea
            y1={domain[0]} y2={t.low}
            fill="rgba(217,119,6,0.07)" ifOverflow="visible"
          />
        )}

        <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.05)" vertical={false} />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={domain}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `${v}${t?.unit ?? ''}`}
          width={42}
        />

        <Tooltip
          content={<SensorTooltip unit={t?.unit ?? ''} thresholds={t} />}
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
        />

        {/* Threshold reference lines */}
        {t?.urgent != null && (
          <ReferenceLine
            y={t.urgent}
            stroke="#EF4444" strokeDasharray="3 3" strokeWidth={0.8}
            label={{ value: `${t.urgent}${t.unit}`, position: 'right', fontSize: 9, fill: '#EF4444' }}
          />
        )}
        {t?.attention != null && (
          <ReferenceLine
            y={t.attention}
            stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={0.8}
            label={{ value: `${t.attention}${t.unit}`, position: 'right', fontSize: 9, fill: '#F59E0B' }}
          />
        )}
        {t?.low != null && (
          <ReferenceLine
            y={t.low}
            stroke="#D97706" strokeDasharray="3 3" strokeWidth={0.8}
            label={{ value: `${t.low}${t.unit}`, position: 'right', fontSize: 9, fill: '#D97706' }}
          />
        )}

        {/* Range band (min–max) if available */}
        <Area
          type="monotone" dataKey="max"
          stroke="none" fill={color} fillOpacity={0.07}
          dot={false} activeDot={false}
          connectNulls
        />
        <Area
          type="monotone" dataKey="min"
          stroke="none" fill="white" fillOpacity={1}
          dot={false} activeDot={false}
          connectNulls
        />

        {/* Main avg line */}
        <Area
          type="monotone" dataKey="avg"
          stroke={color} strokeWidth={2}
          fill={`url(#grad-${sensorType})`}
          dot={<ThresholdDot color={color} thresholds={t} />}
          activeDot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default SensorChart