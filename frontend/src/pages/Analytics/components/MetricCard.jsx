import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { METRIC_CONFIG } from '../config/metricConfig'

/**
 * MetricCard — displays current value, min/max, and a Détails link.
 * For weight, also shows a trend arrow (+ / - delta vs period start).
 */
const MetricCard = ({ metric, value, range, onDetails, isLoading, trend }) => {
  const cfg = METRIC_CONFIG[metric]
  const { Icon } = cfg

  const decimals     = metric === 'weight' ? 2 : 1
  const displayValue = value != null
    ? `${cfg.scale(value).toFixed(decimals)}${cfg.unit}`
    : '—'

  return (
    <div className="flex flex-col gap-3.5 px-5 py-5 flex-1 min-w-0">

      {/* Label + icon */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 tracking-[0.16em] uppercase">
          {cfg.label}
        </span>
        <div className={`w-7 h-7 rounded-lg ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.iconColor }} />
        </div>
      </div>

      {/* Current value */}
      {isLoading ? (
        <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none">
            {displayValue}
          </p>
          {/* Weight trend badge */}
          {metric === 'weight' && trend && !isLoading && (
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold mb-0.5
              ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
              {trend.positive
                ? <TrendingUp  className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {trend.positive ? '+' : ''}{trend.diff}kg
            </span>
          )}
        </div>
      )}

      {/* Min / Max */}
      <div className="flex items-center gap-3 text-[11px] text-gray-400">
        <span>Min: <span className="font-semibold text-gray-500">
          {range?.min != null ? `${range.min}${cfg.unit}` : '—'}
        </span></span>
        <span>Max: <span className="font-semibold text-gray-500">
          {range?.max != null ? `${range.max}${cfg.unit}` : '—'}
        </span></span>
      </div>

      {/* Détails */}
      <button
        onClick={onDetails}
        className="text-[11px] font-medium text-amber-600 hover:text-amber-700
                   transition-colors text-left mt-auto"
      >
        Détails →
      </button>
    </div>
  )
}

export default MetricCard