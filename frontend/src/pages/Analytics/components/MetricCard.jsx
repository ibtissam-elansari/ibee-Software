import React from 'react'
import { METRIC_CONFIG } from '../config/metricConfig'

const MetricCard = ({ metric, value, range, onDetails, isLoading }) => {
  const cfg = METRIC_CONFIG[metric]
  const { Icon } = cfg

  const displayValue = value != null
    ? `${cfg.scale(value).toFixed(metric === 'sound' ? 0 : 1)}${cfg.unit}`
    : '—'

  return (
    <div className="flex flex-col gap-4 px-6 py-5 flex-1 min-w-0">

      {/* Label + icon */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400 tracking-[0.14em] uppercase">
          {cfg.label}
        </span>
        <div className={`w-7 h-7 rounded-lg ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.iconColor }} />
        </div>
      </div>

      {/* Current value — large, centered */}
      {isLoading ? (
        <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <p className="text-4xl font-bold text-gray-900 tracking-tight">
          {displayValue}
        </p>
      )}

      {/* Min / Max */}
      <div className="flex items-center gap-4 text-[11px] text-gray-400">
        <span>Min: <span className="font-medium text-gray-500">
          {range?.min != null ? `${range.min}${cfg.unit}` : '—'}
        </span></span>
        <span>Max: <span className="font-medium text-gray-500">
          {range?.max != null ? `${range.max}${cfg.unit}` : '—'}
        </span></span>
      </div>

      {/* Détails */}
      <button
        onClick={onDetails}
        className="text-[11px] text-gray-400 hover:text-gray-600
                   underline underline-offset-2 transition-colors text-left"
      >
        Détails
      </button>
    </div>
  )
}

export default MetricCard