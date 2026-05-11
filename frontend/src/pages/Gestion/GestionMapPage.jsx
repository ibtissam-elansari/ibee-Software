import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import { Search, Navigation, Lock, LockOpen, RefreshCw, ChevronRight } from 'lucide-react'

import { useHiveList, useHiveLatest } from '../../hooks/useHives'
import { measurementAlertStatus, DEFAULT_THRESHOLDS } from '../../hooks/useHiveThresholds'

// ── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  urgente:   { label: 'Urgent',  color: '#EF4444', bg: 'bg-red-50',    text: 'text-red-500',    border: 'border-red-200'   },
  attention: { label: 'Alerte',  color: '#F59E0B', bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200' },
  normale:   { label: 'Normale', color: '#22C55E', bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200' },
  unknown:   { label: '—',       color: '#9CA3AF', bg: 'bg-gray-50',   text: 'text-gray-400',   border: 'border-gray-200'  },
}

const FILTERS = ['Toutes', 'Urgent', 'Alerte', 'Normale']

// ── Per-hive data hook (wraps latest + derives status) ───────────────────────

function useHiveWithLatest(hive) {
  const { data: latest, isLoading } = useHiveLatest(hive.id)
  const status = useMemo(() => {
    if (!latest) return 'unknown'
    return measurementAlertStatus(latest, DEFAULT_THRESHOLDS) // 'urgente' | 'attention' | 'normale'
  }, [latest])
  return { latest, status, isLoading }
}

// ── Single hive row ──────────────────────────────────────────────────────────

const HiveRow = ({ hive, selected, onClick }) => {
  const { latest, status } = useHiveWithLatest(hive)
  const cfg = STATUS[status]
  const doorOpen = latest?.door_open ?? null
  const hasGps   = hive.gps_lat != null && hive.gps_lng != null

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors
        ${selected ? 'bg-amber-50' : 'hover:bg-gray-50/80'}`}
    >
      {/* Name + status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-bold text-gray-900 truncate">{hive.name?.toUpperCase()}</span>
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          {cfg.label}
        </span>
      </div>

      {/* Location + security */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {hive.location_name && (
            <>
              <Navigation className="w-3 h-3 text-gray-300 flex-shrink-0" />
              <span className="text-[11px] text-gray-400 truncate">{hive.location_name}</span>
            </>
          )}
          {!hive.location_name && !hasGps && (
            <span className="text-[11px] text-gray-300 italic">Pas de localisation</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {doorOpen != null && (
            <div className="flex items-center gap-1">
              {doorOpen
                ? <LockOpen className="w-3 h-3 text-red-500" />
                : <Lock     className="w-3 h-3 text-blue-500" />
              }
              <span className={`text-[10px] font-medium ${doorOpen ? 'text-red-500' : 'text-blue-500'}`}>
                {doorOpen ? 'Ouvert' : 'Fermé'}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Map flyTo controller ─────────────────────────────────────────────────────

const FlyToHive = ({ hive }) => {
  const map = useMap()
  useEffect(() => {
    if (hive?.gps_lat != null && hive?.gps_lng != null) {
      map.flyTo([hive.gps_lat, hive.gps_lng], 15, { duration: 1 })
    }
  }, [hive, map])
  return null
}

// ── Map markers ──────────────────────────────────────────────────────────────

const HiveMarkers = ({ hivesWithStatus, selected, onSelect }) => (
  <>
    {hivesWithStatus.map(({ hive, status }) => {
      if (hive.gps_lat == null || hive.gps_lng == null) return null
      const cfg = STATUS[status]
      const isSelected = selected?.id === hive.id
      return (
        <CircleMarker
          key={hive.id}
          center={[hive.gps_lat, hive.gps_lng]}
          radius={isSelected ? 14 : 10}
          pathOptions={{
            color      : '#fff',
            weight     : isSelected ? 3 : 2,
            fillColor  : cfg.color,
            fillOpacity: isSelected ? 1 : 0.85,
          }}
          eventHandlers={{ click: () => onSelect(hive) }}
        >
          <Tooltip permanent={isSelected} direction="top" offset={[0, -12]}>
            <span className="text-xs font-bold">{hive.name?.toUpperCase()}</span>
          </Tooltip>
        </CircleMarker>
      )
    })}
  </>
)

// ── Summary footer ───────────────────────────────────────────────────────────

const SummaryBar = ({ hivesWithStatus }) => {
  const total    = hivesWithStatus.length
  const urgent   = hivesWithStatus.filter(h => h.status === 'urgente').length
  const open     = hivesWithStatus.filter(h => h.latest?.door_open === true).length

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-5">
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800">{total}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
      </div>
      <div className="w-px h-8 bg-gray-200" />
      <div className="text-center">
        <p className="text-lg font-bold text-blue-500">{total - urgent}</p>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ouvert</p>
        </div>
      </div>
      <div className="w-px h-8 bg-gray-200" />
      <div className="text-center">
        <p className="text-lg font-bold text-red-500">{urgent}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Urgent</p>
      </div>
    </div>
  )
}

// ── Legend ───────────────────────────────────────────────────────────────────

const Legend = () => (
  <div className="absolute top-3 right-3 z-[1000] bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2.5">
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">LÉGENDE</p>
    <div className="flex items-center gap-3">
      {[
        { label: 'Bon',    color: '#22C55E' },
        { label: 'Alerte', color: '#F59E0B' },
        { label: 'Urgent', color: '#EF4444' },
      ].map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500">{label}</span>
          <span className="w-3 h-3 rounded-full block" style={{ backgroundColor: color }} />
        </div>
      ))}
    </div>
  </div>
)

// ── Page ─────────────────────────────────────────────────────────────────────

const GestionMapPage = () => {
  const { apiculteurId } = useParams()
  const navigate         = useNavigate()

  const { data: hives = [], isLoading, refetch } = useHiveList(Number(apiculteurId))

  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('Toutes')
  const [selected, setSelected] = useState(null)

  // Derive status for every hive (needs the latest reading)
  // We collect them via a child component so hooks are called per-hive.
  // Here we build a lookup from the HiveRow renders below.
  const [statusMap, setStatusMap] = useState({})
  const updateStatus = useCallback((hiveId, status, latest) => {
    setStatusMap(prev => {
      if (prev[hiveId]?.status === status) return prev
      return { ...prev, [hiveId]: { status, latest } }
    })
  }, [])

  const hivesWithStatus = useMemo(() =>
    hives.map(h => ({
      hive  : h,
      status: statusMap[h.id]?.status ?? 'unknown',
      latest: statusMap[h.id]?.latest ?? null,
    })),
    [hives, statusMap]
  )

  const filteredHives = useMemo(() => {
    const q = search.trim().toLowerCase()
    const labelMap = { 'Urgent': 'urgente', 'Alerte': 'attention', 'Normale': 'normale' }
    return hivesWithStatus.filter(({ hive, status }) => {
      const matchSearch = !q || hive.name?.toLowerCase().includes(q) || hive.location_name?.toLowerCase().includes(q)
      const matchFilter = filter === 'Toutes' || status === (labelMap[filter] ?? filter)
      return matchSearch && matchFilter
    })
  }, [hivesWithStatus, search, filter])

  // Default map center: average of all hive GPS, or Morocco fallback
  const mapCenter = useMemo(() => {
    const geo = hives.filter(h => h.gps_lat != null && h.gps_lng != null)
    if (!geo.length) return [30.5, -8.0]
    return [
      geo.reduce((s, h) => s + h.gps_lat, 0) / geo.length,
      geo.reduce((s, h) => s + h.gps_lng, 0) / geo.length,
    ]
  }, [hives])

  return (
    <div className="flex h-full overflow-hidden bg-[#FDFAF4]">

      {/* ── Left panel ── */}
      <div className="w-[340px] flex-shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Les ruches</h2>
            <button
              onClick={() => refetch()}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cherche"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm
                         placeholder:text-gray-300 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors
                  ${filter === f
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Hive list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mx-4 my-2 h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))
            : filteredHives.length === 0
              ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-16 text-gray-300">
                  <Navigation className="w-8 h-8" />
                  <p className="text-sm">Aucune ruche trouvée</p>
                </div>
              )
              : filteredHives.map(({ hive }) => (
                  // HiveRowWrapper calls the hook and updates statusMap
                  <HiveRowWithStatus
                    key={hive.id}
                    hive={hive}
                    selected={selected?.id === hive.id}
                    onSelect={() => setSelected(hive)}
                    onStatus={updateStatus}
                  />
                ))
          }
        </div>

        {/* Summary */}
        <div className="flex-shrink-0">
          <SummaryBar hivesWithStatus={hivesWithStatus} />
        </div>
      </div>

      {/* ── Map panel ── */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
            maxZoom={19}
          />

          <HiveMarkers
            hivesWithStatus={hivesWithStatus}
            selected={selected}
            onSelect={setSelected}
          />

          {selected && <FlyToHive hive={selected} />}

          <Legend />
        </MapContainer>

        {/* Selected hive detail card — overlaid on map bottom-left */}
        {selected && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[240px] max-w-[300px]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-gray-900">{selected.name?.toUpperCase()}</h3>
              <button
                onClick={() => navigate(`/apiculteurs/${apiculteurId}/gestion/${selected.id}`)}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-600
                           hover:text-amber-700 transition-colors flex-shrink-0"
              >
                Détails
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {selected.location_name && (
              <div className="flex items-center gap-1.5 mb-2">
                <Navigation className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <span className="text-xs text-gray-500">{selected.location_name}</span>
              </div>
            )}
            {selected.gps_lat != null && (
              <p className="text-[10px] text-gray-400 font-mono">
                {selected.gps_lat.toFixed(5)}, {selected.gps_lng.toFixed(5)}
              </p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-2 p-1 rounded-full text-gray-300 hover:text-gray-500 transition"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Wrapper that calls useHiveLatest per hive and reports up ─────────────────
// (Hooks must be called at component level, not inside map())

const HiveRowWithStatus = ({ hive, selected, onSelect, onStatus }) => {
  const { latest, status } = useHiveWithLatest(hive)

  useEffect(() => {
    onStatus(hive.id, status, latest)
  }, [hive.id, status, latest, onStatus])

  return <HiveRow hive={hive} selected={selected} onClick={onSelect} />
}

export default GestionMapPage