import React from 'react';
import { Thermometer, Droplets, Volume2 } from 'lucide-react';


const METRIC_CONFIG = {
  temperature: {
    label     : 'TEMP',
    unit      : '°C',
    Icon      : Thermometer,
    iconBg    : 'bg-red-50',
    iconColor : '#EF4444',
    valueColor: 'text-gray-900',
  },
  humidity: {
    label     : 'HUM',
    unit      : '%',
    Icon      : Droplets,
    iconBg    : 'bg-blue-50',
    iconColor : '#3B82F6',
    valueColor: 'text-gray-900',
  },
  sound: {
    label     : 'SON',
    unit      : 'Hz',
    Icon      : Volume2,
    iconBg    : 'bg-green-50',
    iconColor : '#22C55E',
    valueColor: 'text-gray-900',
  },
};

const MetricCard = ({ metric, value, range, onDetails, isLoading }) => {
  const cfg = METRIC_CONFIG[metric];
  const { Icon } = cfg;

  const displayValue = value != null
    ? metric === 'sound' ? `${(value * 2).toFixed(0)}${cfg.unit}` : `${value.toFixed(1)}${cfg.unit}`
    : '—';

  return (
    <div className="flex flex-col gap-3 p-4 border-r border-gray-100 last:border-r-0 flex-1">
      {/* Label + icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">{cfg.label}</span>
        <div className={`w-7 h-7 rounded-lg ${cfg.iconBg} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.iconColor }} />
        </div>
      </div>

      {/* Current value */}
      {isLoading ? (
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className={`text-3xl font-bold ${cfg.valueColor}`}>{displayValue}</p>
      )}

      {/* Min / Max */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>Min: {range?.min != null ? `${range.min}${cfg.unit}` : '—'}</span>
        <span>Max: {range?.max != null ? `${range.max}${cfg.unit}` : '—'}</span>
      </div>

      {/* Détails link */}
      <button
        onClick={onDetails}
        className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2
                   transition-colors text-left mt-auto"
      >
        Détails
      </button>
    </div>
  );
};

export default MetricCard;