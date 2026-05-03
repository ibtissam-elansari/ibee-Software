import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Settings, ExternalLink, Download, Scale, TrendingUp, TrendingDown } from 'lucide-react'
import { useHiveList } from '../../hooks/useHives'
import { useHiveAnalytics } from './hooks/useHiveAnalytics'
import { StatusPills }    from './components/StatusPills'
import MetricCard         from './components/MetricCard'
import ComparativeChart   from './components/ComparativeChart'

/**
 * Weight panel — sits between the hive info card and the metric cards.
 * Shows current weight, daily delta, and a tiny sparkline placeholder.
 */
const WeightPanel = ({ weight, trend, isLoading, onDetails }) => (
  <div className="w-44 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between gap-3">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold tracking-[0.16em] text-gray-400 uppercase">Poids</span>
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
        <Scale className="w-3.5 h-3.5 text-gray-500" />
      </div>
    </div>

    {isLoading ? (
      <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse" />
    ) : (
      <div>
        <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none py-3">
          {weight != null ? `${weight.toFixed(2)}kg` : '—'}
        </p>
        {trend && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold
            ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
            {trend.positive
              ? <TrendingUp  className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            <span>{trend.positive ? '+' : ''}{trend.diff} kg aujourd'hui</span>
          </div>
        )}
      </div>
    )}

    <button
      onClick={onDetails}
      className="text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors text-left"
    >
      Détails →
    </button>
  </div>
)

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
    <div className="relative min-h-full overflow-hidden mt-2" style={{ background: '#FDFAF4' }}>
      <div className="relative z-10 flex flex-col gap-5 p-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`${base}/gestion`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       border border-gray-200 bg-white hover:bg-gray-50
                       text-gray-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!isLoading && (
            <StatusPills
              doorOpen={doorOpen}
              rssi={rssi}
              signalLabel={signalLabel}
              battPct={battPct}
            />
          )}
        </div>

        {/* ── Row 1: hive info · weight · metrics ── */}
        <div className="flex gap-4 items-stretch">

          {/* Hive info card */}
          <div className="w-48 flex-shrink-0 bg-white rounded-2xl border border-gray-100
                          shadow-sm p-5 flex flex-col gap-4 pt-8">


            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none break-all">
                {isLoading ? '…' : (hive?.name ?? `Ruche ${hiveId}`).toUpperCase()}
              </h1>
              <button className="text-gray-300 hover:text-gray-500 mt-0.5 flex-shrink-0">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full
                             text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
              Active
            </span>

            <p className="text-[10px] text-gray-400">
              Création :{' '}
              <span className="font-medium text-gray-500">
                {hive?.created_at
                  ? new Date(hive.created_at).toLocaleDateString('fr-FR')
                  : '—'}
              </span>
            </p>

            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                               border border-amber-300 text-amber-600 text-[11px] font-semibold
                               hover:bg-amber-50 transition-colors mt-auto">
              <ExternalLink className="w-3 h-3" />
              Accéder au site
            </button>
          </div>

          {/* Weight panel */}
          <WeightPanel
            weight={weight}
            trend={weightTrend}
            isLoading={isLoading}
            onDetails={() => navigate(`${base}/gestion/${hiveId}/details/weight`)}
          />

          {/* Metric cards panel */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Paramètre de la ruche</h2>
              <Settings className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex divide-x divide-gray-100 h-[calc(100%-45px)]">
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

        {/* ── Row 2: Analyse Comparative ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Analyse Comparative</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Surveillance des capteurs environnementaux en temps réel
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg
                           bg-green-600 hover:bg-green-700 active:bg-green-800
                           text-white text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Excel
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="h-8 px-3 text-xs border border-gray-200 rounded-lg
                           text-gray-600 focus:outline-none focus:border-amber-400 bg-white
                           cursor-pointer"
              />

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-gray-400 hover:text-gray-600
                             underline underline-offset-2 transition-colors"
                >
                  Tout afficher
                </button>
              )}
            </div>
          </div>

          <ComparativeChart
            data={chartData}
            isLoading={isLoading}
            xAxisTicks={xAxisTicks}
          />
        </div>

      </div>
    </div>
  )
}

export default HiveAnalyticsPage