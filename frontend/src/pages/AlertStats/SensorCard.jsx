// pages/AlertStats/SensorCard.jsx
import React from 'react'
import SensorChart from '../../components/charts/SensorChart'
import EventRugChart from '../../components/charts/EventRugChart'
import { SENSOR_THRESHOLDS, TYPE_COLORS, TYPE_LABELS } from '../../hooks/useAlertStats'

/**
 * Derive the "current" value from the last non-null avg in the data array,
 * and compute severity for the header indicator.
 */
function useCurrentValue(data, sensorType) {
  const last = [...data].reverse().find(d => d.avg != null)
  if (!last) return { value: null, severity: 'ok' }

  const val = last.avg
  const t   = SENSOR_THRESHOLDS[sensorType]
  let severity = 'ok'

  if (t) {
    if (t.urgent    != null && val > t.urgent)   severity = 'urgent'
    else if (t.low  != null && val < t.low)      severity = 'urgent'
    else if (t.attention != null && val > t.attention) severity = 'warn'
  }

  return { value: val, severity }
}

const SEVERITY_STYLES = {
  urgent : { badge: 'bg-red-100 text-red-600',    icon: '⚠',  label: 'urgente' },
  warn   : { badge: 'bg-amber-100 text-amber-600', icon: '↑',  label: 'attention' },
  ok     : { badge: 'bg-emerald-100 text-emerald-700', icon: '✓', label: 'normal' },
}

const SENSOR_VALUE_COLOR = {
  urgent: 'text-red-600',
  warn  : 'text-amber-600',
  ok    : 'text-emerald-700',
}

/**
 * SensorCard
 *
 * Props:
 *   sensorType   'temperature' | 'humidity' | 'battery' | 'sound' | 'security'
 *   data         SensorDayStats[]
 *   loading      bool
 *   chartHeight  number (default 130)
 */
const SensorCard = ({ sensorType, data = [], loading = false, chartHeight = 130 }) => {
  const color  = TYPE_COLORS[sensorType]
  const label  = TYPE_LABELS[sensorType]
  const t      = SENSOR_THRESHOLDS[sensorType]
  const isDisc = sensorType === 'security' || sensorType === 'sound'

  const { value, severity } = useCurrentValue(data, sensorType)
  const sevStyle = SEVERITY_STYLES[severity]

  // Threshold subtitle
  let thresholdLabel = ''
  if (t?.urgent != null && t?.attention != null) {
    thresholdLabel = `Attention ${t.attention}${t.unit} · Urgente ${t.urgent}${t.unit}`
  } else if (t?.low != null) {
    thresholdLabel = `Seuil bas ≤ ${t.low}${t.unit}`
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
          </div>
          {thresholdLabel && (
            <p className="text-[10px] text-gray-400 leading-tight">{thresholdLabel}</p>
          )}
          {isDisc && (
            <p className="text-[10px] text-gray-400 leading-tight">Événements discrets</p>
          )}
        </div>

        {/* Current value + severity badge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {!isDisc && value != null && (
            <span className={`text-lg font-semibold leading-none tabular-nums ${SENSOR_VALUE_COLOR[severity]}`}>
              {value}{t?.unit ?? ''}
            </span>
          )}
          {isDisc ? (
            <span className="text-[10px] text-gray-400">
              {data.reduce((s, d) => s + d.count, 0)} événements
            </span>
          ) : (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sevStyle.badge}`}>
              {sevStyle.icon} {sevStyle.label}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      {isDisc ? (
        <EventRugChart
          data={data.map(d => ({ date: d.date, count: d.count }))}
          color={color}
          height={chartHeight}
          loading={loading}
        />
      ) : (
        <SensorChart
          data={data}
          sensorType={sensorType}
          color={color}
          height={chartHeight}
          loading={loading}
        />
      )}
    </div>
  )
}

export default SensorCard