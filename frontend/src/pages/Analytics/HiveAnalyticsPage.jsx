import React from 'react'
import { useParams, useNavigate } from 'react-router'
import { ChevronLeft, Settings, ExternalLink, Download } from 'lucide-react'
import { useHiveList } from '../../hooks/useHives'
import { useHiveAnalytics } from './hooks/useHiveAnalytics'
import { StatusPills }          from './components/StatusPills'
import MetricCard               from './components/MetricCard'
import ComparativeChart         from './components/ComparativeChart'
import { HoneycombBottomRight } from './components/HoneycombDecor'

const HiveAnalyticsPage = () => {
  const { hiveId } = useParams()
  const navigate   = useNavigate()
  const id         = Number(hiveId)

  const { data: hives = [] } = useHiveList()
  const hive = hives.find(h => h.id === id)

  const {
    isLoading,
    temp, humidity, sound, doorOpen, battPct,
    signalLabel, rssi,
    metricRanges,
    chartData,
    xAxisTicks,
    selectedDate, setSelectedDate,
    exportExcel,
  } = useHiveAnalytics(id)

  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: '#FDFAF4' }}>
      <HoneycombBottomRight />

      <div className="relative z-10 flex flex-col gap-5 p-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/gestion')}
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

        {/* ── Row 1: info panel + params panel ── */}
        <div className="flex gap-5 items-stretch">

          {/* Left: hive info */}
          <div className="w-52 flex-shrink-0 bg-white rounded-2xl border border-gray-100
                          shadow-sm p-5 flex flex-col gap-5">
            <div className="flex justify-end">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-amber-400 rounded-full transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full
                                shadow peer-checked:translate-x-4 transition-transform" />
              </label>
            </div>

            <div className="flex items-start justify-between gap-2">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none break-all">
                {isLoading ? '…' : (hive?.name ?? `Ruche ${hiveId}`).toUpperCase()}
              </h1>
              <button className="text-gray-300 hover:text-gray-500 mt-1 flex-shrink-0">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="inline-flex w-fit px-3 py-0.5 rounded-full
                             text-[11px] font-semibold bg-green-100 text-green-700">
              Active
            </span>

            <p className="text-[11px] text-gray-400">
              Date de Création :{' '}
              <span className="font-medium text-gray-500">
                {hive?.created_at
                  ? new Date(hive.created_at).toLocaleDateString('fr-FR')
                  : '—'}
              </span>
            </p>

            <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                               border border-amber-300 text-amber-600 text-xs font-medium
                               hover:bg-amber-50 transition-colors mt-auto">
              <ExternalLink className="w-3.5 h-3.5" />
              Accéder au site
            </button>
          </div>

          {/* Right: params panel */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Paramètre de la ruche</h2>
              <Settings className="w-4 h-4 text-gray-300" />
            </div>

            <div className="flex divide-x divide-gray-100 h-[calc(100%-49px)]">
              {['sound', 'temperature', 'humidity'].map(m => (
                <MetricCard
                  key={m}
                  metric={m}
                  value={m === 'temperature' ? temp : m === 'humidity' ? humidity : sound}
                  range={metricRanges[m === 'temperature' ? 'temp' : m]}
                  onDetails={() => navigate(`/gestion/${hiveId}/details/${m}`)}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Analyse Comparative ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Analyse Comparative</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Surveillance des capteurs environnementaux en temps réel
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Excel export — now calls exportExcel() */}
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg
                           bg-green-600 hover:bg-green-700 active:bg-green-800
                           text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Excel
              </button>

              {/* Date filter — now wired to selectedDate */}
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="h-8 px-3 text-xs border border-gray-200 rounded-lg
                           text-gray-500 focus:outline-none focus:border-amber-400 bg-white
                           cursor-pointer"
              />

              {/* Clear date filter */}
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-gray-400 hover:text-gray-600 underline
                             underline-offset-2 transition-colors"
                >
                  Tout afficher
                </button>
              )}
            </div>
          </div>

          <ComparativeChart data={chartData} isLoading={isLoading} xAxisTicks={xAxisTicks} />
        </div>

      </div>
    </div>
  )
}

export default HiveAnalyticsPage