import React from 'react'
import { Bell, Filter } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { useAlertStats } from '../../hooks/useAlertStats'

// ── Type badge config ─────────────────────────────────────────────────────────
const TYPE_BADGE = {
  security    : { label: 'Sécurité',    bg: 'bg-blue-50',   text: 'text-blue-600',   dot: '#2563EB' },
  temperature : { label: 'Température', bg: 'bg-red-50',    text: 'text-red-500',    dot: '#EF4444' },
  humidity    : { label: 'Humidité',    bg: 'bg-blue-50',   text: 'text-blue-500',   dot: '#3B82F6' },
  battery     : { label: 'Batterie',    bg: 'bg-amber-50',  text: 'text-amber-600',  dot: '#D97706' },
  sound       : { label: 'Sonore',      bg: 'bg-green-50',  text: 'text-green-600',  dot: '#16A34A' },
  geofencing  : { label: 'Localisation',bg: 'bg-red-50',    text: 'text-red-500',    dot: '#EF4444' },
}

const TypeBadge = ({ type }) => {
  const cfg = TYPE_BADGE[type] ?? TYPE_BADGE.security
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                      text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: cfg.dot }} />
    </span>
  )
}

// ── Range tab ─────────────────────────────────────────────────────────────────
const RangeTab = ({ id, label, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors
      ${active ? 'bg-amber-400 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
  >
    {label}
  </button>
)

// ── Custom tooltip ────────────────────────────────────────────────────────────
const AreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-gray-800">{payload[0].value} alertes</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const AlertStatsPage = () => {
  const {
    timelineData, timelineLoading,
    range, setRange, startDate, setStartDate, endDate, setEndDate,
    weeklyData, weeklyLoading, weekLabel,
    alerts, alertsLoading, totalToday,
    typeFilter, setTypeFilter,
    impFilter,  setImpFilter,
  } = useAlertStats()

  return (
    <div className="flex gap-5 p-6 min-h-full" style={{ background: '#FDFAF4' }}>

      {/* ── LEFT COLUMN ── */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">

        {/* Timeline chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Nombre d'alertes en fonction du temps
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Présentation visuelle des alertes reçues à travers la ruche
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Custom date range */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="h-7 px-2 border border-gray-200 rounded-lg text-xs
                             text-gray-500 focus:outline-none focus:border-amber-400 bg-white"
                />
                <span>→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="h-7 px-2 border border-gray-200 rounded-lg text-xs
                             text-gray-500 focus:outline-none focus:border-amber-400 bg-white"
                />
              </div>
              {/* Range tabs */}
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200
                              rounded-lg p-0.5">
                {['7j', '15j', 'Mois'].map(r => (
                  <RangeTab key={r} id={r} label={r} active={range === r} onClick={setRange} />
                ))}
              </div>
            </div>
          </div>

          {timelineLoading ? (
            <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
          ) : timelineData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-gray-300
                            bg-gray-50 rounded-xl">
              Aucune alerte sur cette période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F9A8D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F9A8D4" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<AreaTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#F472B6"
                  strokeWidth={2}
                  fill="url(#alertGrad)"
                  dot={{ fill: '#F472B6', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#F472B6', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Aperçu hebdomadaire des alertes urgentes
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200
                             px-3 py-1 rounded-lg">
              {weekLabel}
            </span>
          </div>

          {weeklyLoading ? (
            <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                        barCategoryGap="40%">
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white', border: '1px solid #F3F4F6',
                    borderRadius: 12, fontSize: 12,
                  }}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Alertes urgentes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN — alert log ── */}
      <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100
                      shadow-sm flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Historique des Alertes</h2>
          <Bell className="w-4 h-4 text-gray-300" />
        </div>

        {/* Today label + count */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">Aujourd'hui</span>
          <span className="text-xs text-gray-400">{totalToday} alertes</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <input
            type="date"
            className="h-7 px-2 border border-gray-200 rounded-lg text-[11px]
                       text-gray-500 focus:outline-none focus:border-amber-400 bg-white flex-1"
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-7 px-2 border border-gray-200 rounded-lg text-[11px]
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
            className="h-7 px-2 border border-gray-200 rounded-lg text-[11px]
                       text-gray-600 focus:outline-none focus:border-amber-400 bg-white"
          >
            <option value="">Importance</option>
            <option value="urgente">Urgente</option>
            <option value="attention">Attention</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
        </div>

        {/* Table header */}
        <div className="grid grid-cols-3 px-4 py-2 text-[10px] font-semibold
                        uppercase tracking-wider text-gray-400 border-b border-gray-100">
          <span>Date</span>
          <span>Temps</span>
          <span>Type</span>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {alertsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 mx-4 my-1.5 bg-gray-50 rounded-lg animate-pulse" />
            ))
          ) : alerts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-300">
              Aucune alerte
            </div>
          ) : (
            alerts.map((alert) => {
              const isUrgent = alert.importance === 'urgente'
              const date     = new Date(alert.ts)
              const dateStr  = date.toLocaleDateString('fr-FR')
              const timeStr  = date.toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              })
              return (
                <div
                  key={alert.id}
                  className={`grid grid-cols-3 items-center px-4 py-3 border-b border-gray-50
                              ${isUrgent ? 'bg-red-50/50' : 'bg-white hover:bg-gray-50'}
                              transition-colors`}
                >
                  <span className="text-[11px] text-gray-600">{dateStr}</span>
                  <span className="text-[11px] text-gray-500">{timeStr}</span>
                  <TypeBadge type={alert.type} />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertStatsPage