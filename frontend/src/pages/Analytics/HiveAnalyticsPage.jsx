import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Settings, ExternalLink, Download, Scale, TrendingUp, TrendingDown } from 'lucide-react'
import { useHiveList } from '../../hooks/useHives'
import { useHiveAnalytics } from './hooks/useHiveAnalytics'
import { StatusPills }    from './components/StatusPills'
import MetricCard         from './components/MetricCard'
import ComparativeChart   from './components/ComparativeChart'

const HiveAnalyticsPage = () => {
  const { apiculteurId, hiveId } = useParams()
  const navigate = useNavigate()
  const id       = Number(hiveId)
  const base     = `/apiculteurs/${apiculteurId}`

  const { data: hives = [] } = useHiveList(Number(apiculteurId))
  const hive = hives.find(h => h.id === id)

  const {
    isLoading,
    temp, humidity, sound, weight,
    doorOpen, battPct, signalLabel, rssi,
    metricRanges, weightTrend,
    chartData, xAxisTicks,
    selectedDate, setSelectedDate,
    exportExcel,
  } = useHiveAnalytics(id)

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ background: '#FDFAF4' }}>
      <div className="flex flex-col gap-4 p-4 lg:p-6 flex-1">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => navigate(`${base}/gestion`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0
                       border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!isLoading && (
            <div className="ml-auto">
              <StatusPills doorOpen={doorOpen} rssi={rssi} signalLabel={signalLabel} battPct={battPct} />
            </div>
          )}
        </div>

        {/* ── Main info row — only on xl+ (true wide desktop) ── */}
        <div className="hidden xl:flex gap-4 items-stretch">
          {/* Hive info card */}
          <div className="w-48 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 pt-8">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none break-all">
                {isLoading ? '…' : (hive?.name ?? `Ruche ${hiveId}`).toUpperCase()}
              </h1>
              <button className="text-gray-300 hover:text-gray-500 mt-0.5 flex-shrink-0">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
              Active
            </span>
            <p className="text-[10px] text-gray-400">
              Création : <span className="font-medium text-gray-500">
                {hive?.created_at ? new Date(hive.created_at).toLocaleDateString('fr-FR') : '—'}
              </span>
            </p>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                               border border-amber-300 text-amber-600 text-[11px] font-semibold
                               hover:bg-amber-50 transition-colors mt-auto">
              <ExternalLink className="w-3 h-3" />
              Accéder au site
            </button>
          </div>

          {/* Metric cards — 4 columns on xl (weight + 3 sensors) */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-w-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Paramètre de la ruche</h2>
              <Settings className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex divide-x divide-gray-100 h-[calc(100%-45px)]">
              {/* Weight as first metric card */}
              <div className="flex flex-col gap-3.5 px-5 py-5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 tracking-[0.16em] uppercase">Poids</span>
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Scale className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
                ) : (
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none">
                      {weight != null ? `${weight.toFixed(2)}kg` : '—'}
                    </p>
                    {weightTrend && (
                      <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold mb-0.5
                        ${weightTrend.positive ? 'text-green-600' : 'text-red-500'}`}>
                        {weightTrend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {weightTrend.positive ? '+' : ''}{weightTrend.diff}kg
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>Min: <span className="font-semibold text-gray-500">
                    {metricRanges?.weight?.min != null ? `${metricRanges.weight.min}kg` : '—'}
                  </span></span>
                  <span>Max: <span className="font-semibold text-gray-500">
                    {metricRanges?.weight?.max != null ? `${metricRanges.weight.max}kg` : '—'}
                  </span></span>
                </div>
                <button
                  onClick={() => navigate(`${base}/gestion/${hiveId}/details/weight`)}
                  className="text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors text-left mt-auto"
                >
                  Détails →
                </button>
              </div>

              {/* 3 sensor metric cards */}
              {(['sound', 'temperature', 'humidity']).map(m => (
                <MetricCard
                  key={m}
                  metric={m}
                  value={m === 'temperature' ? temp : m === 'humidity' ? humidity : sound}
                  range={metricRanges[m === 'temperature' ? 'temp' : m]}
                  onDetails={() => navigate(`${base}/gestion/${hiveId}/details/${m}`)}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Below xl: compact hive header + 2×2 metric grid ── */}
        <div className="xl:hidden flex flex-col gap-4">

          {/* Hive info — compact horizontal card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none truncate">
                {isLoading ? '…' : (hive?.name ?? `Ruche ${hiveId}`).toUpperCase()}
              </h1>
              <div className="flex items-center gap-3">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                  Active
                </span>
                {hive?.created_at && (
                  <p className="text-[10px] text-gray-400">
                    Créé le <span className="font-medium text-gray-500">
                      {new Date(hive.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-600 text-[11px] font-semibold hover:bg-amber-50 transition-colors">
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Accéder au site</span>
              </button>
              <button className="text-gray-300 hover:text-gray-500">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2×2 metric grid: weight · sound · temp · humidity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Paramètre de la ruche</h2>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">

              {/* Weight cell */}
              <div className="flex flex-col gap-2.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 tracking-[0.16em] uppercase">Poids</span>
                  <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Scale className="w-3 h-3 text-gray-500" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                    {weight != null ? `${weight.toFixed(2)}kg` : '—'}
                  </p>
                )}
                <div className="text-[10px] text-gray-400">
                  <span>Min: <b className="text-gray-500">{metricRanges?.weight?.min ?? '—'}kg</b></span>
                  {' · '}
                  <span>Max: <b className="text-gray-500">{metricRanges?.weight?.max ?? '—'}kg</b></span>
                </div>
                <button
                  onClick={() => navigate(`${base}/gestion/${hiveId}/details/weight`)}
                  className="text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors text-left"
                >
                  Détails →
                </button>
              </div>

              {/* 3 sensor metric cards in the grid */}
              {(['sound', 'temperature', 'humidity']).map(m => (
                <MetricCard
                  key={m}
                  metric={m}
                  value={m === 'temperature' ? temp : m === 'humidity' ? humidity : sound}
                  range={metricRanges[m === 'temperature' ? 'temp' : m]}
                  onDetails={() => navigate(`${base}/gestion/${hiveId}/details/${m}`)}
                  isLoading={isLoading}
                  compact
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Analyse Comparative — grows to fill viewport below the cards ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-6 flex flex-col"
             style={{ minHeight: 380 }}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900">Analyse Comparative</h2>
              <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">
                Surveillance des capteurs environnementaux en temps réel
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700
                           text-white text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-600
                           focus:outline-none focus:border-amber-400 bg-white cursor-pointer flex-1 sm:flex-none min-w-0"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors whitespace-nowrap"
                >
                  Tout afficher
                </button>
              )}
            </div>
          </div>
          <div style={{ height: 300 }}>
            <ComparativeChart data={chartData} isLoading={isLoading} />
          </div>
        </div>

      </div>
    </div>
  )
}

export default HiveAnalyticsPage