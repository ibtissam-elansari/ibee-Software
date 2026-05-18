// pages/AlertStats/AlertLog.jsx
import React from 'react'
import { Bell, Filter } from 'lucide-react'

// ── Type badge ─────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  security   : { label: 'Sécu.',  bg: 'bg-blue-50',   text: 'text-blue-600',  dot: '#2563EB' },
  temperature: { label: 'Temp.',  bg: 'bg-red-50',    text: 'text-red-500',   dot: '#EF4444' },
  humidity   : { label: 'Hum.',   bg: 'bg-blue-50',   text: 'text-blue-500',  dot: '#3B82F6' },
  battery    : { label: 'Batt.',  bg: 'bg-amber-50',  text: 'text-amber-600', dot: '#D97706' },
  sound      : { label: 'Son.',   bg: 'bg-green-50',  text: 'text-green-600', dot: '#16A34A' },
}

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] ?? TYPE_CFG.security
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                      text-[10px] font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ── Measured value chip ────────────────────────────────────────────────────────
const VALUE_CFG = {
  temperature: (v) => v > 38 ? 'bg-red-100 text-red-600' : v > 35 ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-500',
  humidity   : (v) => v > 80 ? 'bg-blue-100 text-blue-700' : v > 70 ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-500',
  battery    : (v) => v <= 3.4 ? 'bg-red-100 text-red-600' : v <= 3.6 ? 'bg-amber-100 text-amber-600' : 'bg-green-50 text-green-600',
  sound      : (v) => v > 85 ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600',
  security   : ()  => 'bg-blue-50 text-blue-600',
}

const ValueChip = ({ type, value, unit }) => {
  if (value == null && type !== 'security') return null
  const colorClass = VALUE_CFG[type]?.(value) ?? 'bg-gray-100 text-gray-600'
  const display    = type === 'security' ? 'Porte ouverte' : `${value}${unit}`
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold
                      whitespace-nowrap ${colorClass}`}>
      {display}
    </span>
  )
}

// ── Importance indicator ───────────────────────────────────────────────────────
const ImpDot = ({ importance }) =>
  importance === 'urgente'
    ? <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-0.5" />
    : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-0.5" />

// ── Main component ─────────────────────────────────────────────────────────────
const AlertLog = ({
  alerts,
  alertsLoading,
  totalToday,
  typeFilter,   setTypeFilter,
  impFilter,    setImpFilter,
}) => (
  <>
    {/* Header summary */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
      <span className="text-sm font-semibold text-gray-800">Détail des alertes</span>
      {totalToday > 0 && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
          {totalToday} ce jour
        </span>
      )}
    </div>

    {/* Filters */}
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
      <select
        value={typeFilter}
        onChange={e => setTypeFilter(e.target.value)}
        className="flex-1 h-7 px-1.5 border border-gray-200 rounded-lg text-[11px]
                   text-gray-600 focus:outline-none focus:border-amber-400 bg-white"
      >
        <option value="">Type</option>
        <option value="security">Sécurité</option>
        <option value="temperature">Température</option>
        <option value="humidity">Humidité</option>
        <option value="battery">Batterie</option>
        <option value="sound">Sonore</option>
      </select>
      <select
        value={impFilter}
        onChange={e => setImpFilter(e.target.value)}
        className="flex-1 h-7 px-1.5 border border-gray-200 rounded-lg text-[11px]
                   text-gray-600 focus:outline-none focus:border-amber-400 bg-white"
      >
        <option value="">Importance</option>
        <option value="urgente">Urgente</option>
        <option value="attention">Attention</option>
      </select>
      <Filter className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
    </div>

    {/* Column headers — 5 cols: · Date · H. · Ruche · Type · Valeur */}
    <div className="grid px-3 py-1.5 border-b border-gray-100 flex-shrink-0
                    text-[9px] font-semibold uppercase tracking-wider text-gray-400"
         style={{ gridTemplateColumns: '8px 38px 34px minmax(0,1fr) 52px 58px' }}>
      <span />
      <span>Date</span>
      <span>H.</span>
      <span>Ruche</span>
      <span>Type</span>
      <span>Valeur</span>
    </div>

    {/* Rows */}
    <div className="flex-1 overflow-y-auto min-h-0">
      {alertsLoading ? (
        <div className="p-3 flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <Bell className="w-6 h-6 text-green-300" />
          <p className="text-sm text-gray-300">Aucune alerte</p>
        </div>
      ) : (
        alerts.map(alert => {
          const isUrgent = alert.importance === 'urgente'
          const dt       = new Date(alert.ts)
          return (
            <div
              key={alert.id}
              className={`grid items-center px-3 py-2.5 border-b border-gray-50 gap-1
                          transition-colors cursor-default
                          ${isUrgent ? 'bg-red-50/30 hover:bg-red-50/60' : 'bg-white hover:bg-gray-50'}`}
              style={{ gridTemplateColumns: '8px 38px 34px minmax(0,1fr) 52px 58px' }}
            >
              {/* importance dot */}
              <ImpDot importance={alert.importance} />

              {/* date */}
              <span className="text-[10px] text-gray-600 tabular-nums">
                {dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </span>

              {/* time */}
              <span className="text-[10px] text-gray-400 tabular-nums">
                {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* hive name */}
              <span className="text-[10px] text-gray-500 truncate" title={alert.hive_name}>
                {alert.hive_name}
              </span>

              {/* type badge */}
              <TypeBadge type={alert.type} />

              {/* measured value */}
              <ValueChip
                type={alert.type}
                value={alert.measured_value}
                unit={alert.measured_unit ?? ''}
              />
            </div>
          )
        })
      )}
    </div>
  </>
)

export default AlertLog