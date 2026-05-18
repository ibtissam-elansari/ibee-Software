// pages/AlertStats/AlertStatsPage.jsx
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Bell, ChevronDown, ChevronUp } from 'lucide-react'

import { useAlertStats } from '../../hooks/useAlertStats'
import { useHiveList }   from '../../hooks/useHives'

import VolumeTimeline from '../../components/charts/VolumeTimeline'
import SensorCard     from './SensorCard'
import AlertLog       from './AlertLog'
import { KpiStrip, TypeBreakdown, HiveBreakdown } from './StatPanels'

// ── Shared primitives ──────────────────────────────────────────────────────────

const RangeTab = ({ id, label, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors
      ${active
        ? 'bg-amber-400 text-white'
        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
  >
    {label}
  </button>
)

const HiveSelector = ({ hives, selectedHiveId, onChange, loading }) => (
  <div className="relative">
    <select
      value={selectedHiveId ?? ''}
      onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={loading}
      className="h-8 pl-3 pr-8 border border-gray-200 rounded-lg text-xs text-gray-600
                 focus:outline-none focus:border-amber-400 bg-white cursor-pointer
                 appearance-none disabled:opacity-50 min-w-[140px]"
    >
      <option value="">Toutes les ruches</option>
      {hives.map(h => (
        <option key={h.id} value={h.id}>{h.name}</option>
      ))}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                            text-gray-400 pointer-events-none" />
  </div>
)

// ── Page ───────────────────────────────────────────────────────────────────────

const AlertStatsPage = () => {
  const { apiculteurId }       = useParams()
  const numericApiculteurId    = Number(apiculteurId)
  const [logOpen, setLogOpen]  = useState(false)

  const { data: hives = [], isLoading: hivesLoading } = useHiveList(numericApiculteurId)

  const {
    range, setRange,
    startDate, setStartDate,
    endDate,   setEndDate,
    selectedHiveId, setSelectedHiveId,
    typeFilter, setTypeFilter,
    impFilter,  setImpFilter,
    kpis,
    timelineData,   timelineLoading,
    sensorData,     sensorLoading,
    alerts,         alertsLoading,
  } = useAlertStats(numericApiculteurId)

  // Responsive chart height: shorter on small screens
  const isMobile      = typeof window !== 'undefined' && window.innerWidth < 640
  const sensorHeight  = isMobile ? 110 : 140
  const volumeHeight  = isMobile ? 160 : 200

  const isCustomRange = !!(startDate || endDate)

  return (
    <div
      className="flex flex-col lg:flex-row gap-4 lg:gap-5 p-4 sm:p-5"
      style={{ background: '#FDFAF4', minHeight: '100%' }}
    >
      {/* ── MAIN COLUMN ── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">

          {/* Row 1 — hive + preset tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <HiveSelector
              hives={hives}
              selectedHiveId={selectedHiveId}
              onChange={setSelectedHiveId}
              loading={hivesLoading}
            />
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              {['7j', '15j', 'Mois'].map(r => (
                <RangeTab
                  key={r} id={r} label={r}
                  active={range === r && !isCustomRange}
                  onClick={v => { setRange(v); setStartDate(''); setEndDate('') }}
                />
              ))}
            </div>
          </div>

          {/* Row 2 — date pickers */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hidden sm:inline text-xs text-gray-400 font-medium">Période :</span>
            <input
              type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="h-8 px-2 sm:px-3 border border-gray-200 rounded-lg text-xs text-gray-500
                         focus:outline-none focus:border-amber-400 bg-white w-full sm:w-auto"
            />
            <span className="text-gray-300">→</span>
            <input
              type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="h-8 px-2 sm:px-3 border border-gray-200 rounded-lg text-xs text-gray-500
                         focus:outline-none focus:border-amber-400 bg-white w-full sm:w-auto"
            />
            {isCustomRange && (
              <button
                onClick={() => { setStartDate(''); setEndDate('') }}
                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 whitespace-nowrap"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <KpiStrip kpis={kpis} loading={alertsLoading} />

        {/* Mobile alert log toggle */}
        <button
          onClick={() => setLogOpen(o => !o)}
          className="lg:hidden flex items-center justify-between w-full bg-white border
                     border-gray-100 rounded-2xl px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Historique des alertes</span>
            {kpis.totalToday > 0 && (
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {kpis.totalToday}
              </span>
            )}
          </div>
          {logOpen
            ? <ChevronUp   className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {/* Mobile alert log expanded */}
        {logOpen && (
          <div
            className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col"
            style={{ maxHeight: '60vh' }}
          >
            <AlertLog
              alerts={alerts}
              alertsLoading={alertsLoading}
              totalToday={kpis.totalToday}
              typeFilter={typeFilter} setTypeFilter={setTypeFilter}
              impFilter={impFilter}   setImpFilter={setImpFilter}
            />
          </div>
        )}

        {/* Volume timeline */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Volume d'alertes par jour
              {selectedHiveId && (
                <span className="ml-2 font-normal text-amber-600">
                  — {hives.find(h => h.id === selectedHiveId)?.name}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">
              Zones empilées : rouge = urgentes · jaune = attention
            </p>
          </div>
          <VolumeTimeline
            data={timelineData}
            height={volumeHeight}
            loading={timelineLoading}
          />
        </div>

        {/* Sensor charts — 2×2 on sm+, 1 col on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SensorCard
            sensorType="temperature"
            data={sensorData.temperature}
            loading={sensorLoading.temperature}
            chartHeight={sensorHeight}
          />
          <SensorCard
            sensorType="humidity"
            data={sensorData.humidity}
            loading={sensorLoading.humidity}
            chartHeight={sensorHeight}
          />
          <SensorCard
            sensorType="battery"
            data={sensorData.battery}
            loading={sensorLoading.battery}
            chartHeight={sensorHeight}
          />
          <SensorCard
            sensorType="sound"
            data={sensorData.sound}
            loading={sensorLoading.sound}
            chartHeight={sensorHeight}
          />
        </div>

        {/* Security (full width — discrete events) */}
        <SensorCard
          sensorType="security"
          data={sensorData.security}
          loading={sensorLoading.security}
          chartHeight={isMobile ? 90 : 110}
        />

        {/* Bottom panels: type breakdown + hive breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TypeBreakdown
            typeBreakdown={kpis.typeBreakdown}
            loading={alertsLoading}
          />
          <HiveBreakdown
            hiveBreakdown={kpis.hiveBreakdown}
            loading={alertsLoading}
          />
        </div>

      </div>{/* /main */}

      {/* ── DESKTOP SIDEBAR: sticky alert log ── */}
      <div
        className="hidden lg:flex w-80 flex-shrink-0 bg-white rounded-2xl border
                   border-gray-100 shadow-sm flex-col"
        style={{ height: 'calc(100vh - 96px)', position: 'sticky', top: '24px' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3
                        border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">Historique des alertes</h2>
          <Bell className="w-4 h-4 text-gray-300" />
        </div>
        <AlertLog
          alerts={alerts}
          alertsLoading={alertsLoading}
          totalToday={kpis.totalToday}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          impFilter={impFilter}   setImpFilter={setImpFilter}
        />
      </div>

    </div>
  )
}

export default AlertStatsPage