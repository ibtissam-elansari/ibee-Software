import React from 'react'
import { METRIC_CONFIG } from '../config/metricConfig'

/**
 * MetricCard — two modes:
 *  default : full padding, larger text  (used in xl desktop row)
 *  compact : tighter padding, fits 2×2 grid (used below xl)
 */
const MetricCard = ({ metric, value, range, onDetails, isLoading, compact = false }) => {
  const cfg = METRIC_CONFIG[metric]
  const { Icon } = cfg

  const decimals     = metric === 'weight' ? 2 : 1
  const displayValue = value != null
    ? `${cfg.scale(value).toFixed(decimals)}${cfg.unit}`
    : '—'

  if (compact) {
    return (
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.16em] uppercase">
            {cfg.label}
          </span>
          <div className={`w-6 h-6 rounded-lg ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-3 h-3" style={{ color: cfg.iconColor }} />
          </div>
        </div>

        {isLoading ? (
          <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
            {displayValue}
          </p>
        )}

        <div className="text-[10px] text-gray-400 leading-relaxed">
          <span>Min: <b className="text-gray-500">{range?.min != null ? `${range.min}${cfg.unit}` : '—'}</b></span>
          {' · '}
          <span>Max: <b className="text-gray-500">{range?.max != null ? `${range.max}${cfg.unit}` : '—'}</b></span>
        </div>

        <button
          onClick={onDetails}
          className="text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors text-left"
        >
          Détails →
        </button>
      </div>
    )
  }

  // Default (desktop) mode
  return (
    <div className="flex flex-col gap-3.5 px-5 py-5 flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 tracking-[0.16em] uppercase">
          {cfg.label}
        </span>
        <div className={`w-7 h-7 rounded-lg ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.iconColor }} />
        </div>
      </div>

      {isLoading ? (
        <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none">
          {displayValue}
        </p>
      )}

      <div className="flex items-center gap-3 text-[11px] text-gray-400">
        <span>Min: <span className="font-semibold text-gray-500">
          {range?.min != null ? `${range.min}${cfg.unit}` : '—'}
        </span></span>
        <span>Max: <span className="font-semibold text-gray-500">
          {range?.max != null ? `${range.max}${cfg.unit}` : '—'}
        </span></span>
      </div>

      <button
        onClick={onDetails}
        className="text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors text-left mt-auto"
      >
        Détails →
      </button>
    </div>
  )
}

export default MetricCard