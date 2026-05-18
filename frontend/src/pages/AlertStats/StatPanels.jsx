// pages/AlertStats/StatPanels.jsx
import React from 'react'
import { TYPE_COLORS, TYPE_LABELS, ALERT_TYPES } from '../../hooks/useAlertStats'

// ── KPI strip ─────────────────────────────────────────────────────────────────

const Delta = ({ value }) => {
  if (value === 0) return <span className="text-[10px] text-gray-400">= vs hier</span>
  const up = value > 0
  return (
    <span className={`text-[10px] font-medium ${up ? 'text-red-500' : 'text-emerald-600'}`}>
      {up ? '↑' : '↓'} {Math.abs(value)} vs hier
    </span>
  )
}

export const KpiStrip = ({ kpis, loading }) => {
  const items = [
    {
      label: "Aujourd'hui",
      value: loading ? '—' : kpis.totalToday,
      sub  : loading ? null : <Delta value={kpis.deltaToday} />,
      color: kpis?.deltaToday > 0 ? 'text-red-600' : 'text-gray-900',
    },
    {
      label: 'Période',
      value: loading ? '—' : kpis.totalPeriod,
      sub  : <span className="text-[10px] text-gray-400">alertes totales</span>,
      color: 'text-gray-900',
    },
    {
      label: 'Urgentes',
      value: loading ? '—' : kpis.urgentPeriod,
      sub  : loading ? null : (
        <span className="text-[10px] text-gray-400">{kpis.urgentPct}% du total</span>
      ),
      color: 'text-red-600',
    },
    {
      label: 'Ruche + active',
      value: loading ? '—' : kpis.topHiveName,
      sub  : loading ? null : (
        <span className="text-[10px] text-gray-400">{kpis.topHiveCount} alertes</span>
      ),
      color: 'text-gray-900',
      small: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ label, value, sub, color, small }) => (
        <div
          key={label}
          className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm"
        >
          <p className="text-[11px] text-gray-400 mb-1">{label}</p>
          <p className={`font-semibold leading-tight mb-1
                         ${small ? 'text-base' : 'text-2xl'} ${color}`}>
            {value}
          </p>
          {sub}
        </div>
      ))}
    </div>
  )
}

// ── Per-type breakdown ────────────────────────────────────────────────────────

export const TypeBreakdown = ({ typeBreakdown = [], loading }) => {
  const max = Math.max(...typeBreakdown.map(t => t.count), 1)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Répartition par type</h3>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {ALERT_TYPES.map(type => {
            const item  = typeBreakdown.find(t => t.type === type) ?? { count: 0 }
            const pct   = max > 0 ? (item.count / max) * 100 : 0
            const color = TYPE_COLORS[type]
            return (
              <div key={type} className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] text-gray-500 truncate">
                    {TYPE_LABELS[type]}
                  </span>
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-700 w-5 text-right tabular-nums">
                  {item.count}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Per-hive breakdown ────────────────────────────────────────────────────────

export const HiveBreakdown = ({ hiveBreakdown = [], loading }) => {
  const max = Math.max(...hiveBreakdown.map(h => h.count), 1)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Alertes par ruche</h3>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : hiveBreakdown.length === 0 ? (
        <p className="text-xs text-gray-300 text-center py-4">Aucune donnée</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {hiveBreakdown.map(({ name, count }) => {
            const pct = max > 0 ? (count / max) * 100 : 0
            return (
              <div key={name} className="flex items-center gap-2.5">
                <span className="text-[11px] text-gray-500 w-24 truncate flex-shrink-0" title={name}>
                  {name}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: count === 0
                        ? '#D1FAE5'
                        : pct === 100
                          ? '#EF4444'
                          : '#F59E0B',
                    }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-700 w-5 text-right tabular-nums">
                  {count === 0
                    ? <span className="text-emerald-500 font-medium">0</span>
                    : count}
                </span>
              </div>
            )
          })}
        </div>
      )}
      {/* Contextual notice if one hive dominates */}
      {!loading && hiveBreakdown.length > 1 && (() => {
        const top    = hiveBreakdown[0]
        const total  = hiveBreakdown.reduce((s, h) => s + h.count, 0)
        const topPct = total > 0 ? Math.round((top.count / total) * 100) : 0
        if (topPct >= 40 && top.count > 0) {
          return (
            <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border-l-2
                          border-amber-400 rounded-r-lg px-3 py-1.5 leading-snug">
              <strong>{top.name}</strong> concentre {topPct}% des alertes — vérification conseillée
            </p>
          )
        }
        return null
      })()}
    </div>
  )
}