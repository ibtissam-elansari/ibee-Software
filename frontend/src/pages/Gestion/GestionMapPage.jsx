import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import { Search, Navigation, Lock, LockOpen, RefreshCw, ChevronRight, MapPin, MapPinOff } from 'lucide-react'

import { useHiveList, useHiveLatest } from '../../hooks/useHives'
import { measurementAlertStatus, DEFAULT_THRESHOLDS } from '../../hooks/useHiveThresholds'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
  urgente:   { label: 'Urgent',  color: '#EF4444', bg: 'bg-red-50',   text: 'text-red-500',   border: 'border-red-200'   },
  urgent:    { label: 'Urgent',  color: '#EF4444', bg: 'bg-red-50',   text: 'text-red-500',   border: 'border-red-200'   },
  attention: { label: 'Alerte',  color: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  normale:   { label: 'Normale', color: '#22C55E', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  normal:    { label: 'Normale', color: '#22C55E', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  ok:        { label: 'Normale', color: '#22C55E', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  unknown:   { label: '—',       color: '#9CA3AF', bg: 'bg-gray-50',  text: 'text-gray-400',  border: 'border-gray-200'  },
}
const getStatusCfg = (s) => STATUS[s] ?? STATUS.unknown

const hasGps = (h) => h?.gps_lat != null && h?.gps_lng != null

const FILTERS = ['Toutes', 'Urgent', 'Alerte', 'Normale']

// ── Per-hive hook ─────────────────────────────────────────────────────────────

function useHiveWithLatest(hive) {
  const { data: latest } = useHiveLatest(hive.id)
  const status = useMemo(() => {
    if (!latest) return 'unknown'
    try { return measurementAlertStatus(latest, DEFAULT_THRESHOLDS) ?? 'unknown' }
    catch { return 'unknown' }
  }, [latest])
  return { latest, status }
}

// ── Hive list row ─────────────────────────────────────────────────────────────

const HiveRow = ({ hive, selected, onClick, status, latest }) => {
  const cfg      = getStatusCfg(status)
  const doorOpen = latest?.door_open ?? null
  const gps      = hasGps(hive)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors
        ${selected ? 'bg-amber-50 border-l-2 border-l-amber-400' : 'hover:bg-gray-50/80'}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {gps
            ? <MapPin    className="w-3 h-3 text-green-400 flex-shrink-0" />
            : <MapPinOff className="w-3 h-3 text-gray-300 flex-shrink-0" />
          }
          <span className="text-sm font-bold text-gray-900 truncate">{hive.name?.toUpperCase()}</span>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 pl-4">
        {gps
          ? <span className="text-[10px] text-gray-400 font-mono">
              {hive.gps_lat.toFixed(4)}, {hive.gps_lng.toFixed(4)}
            </span>
          : <span className="text-[10px] text-gray-300 italic">Coordonnées GPS manquantes</span>
        }
        {doorOpen != null && (
          <div className="flex items-center gap-1 flex-shrink-0">
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
    </button>
  )
}

// ── Wrapper: hook per hive ────────────────────────────────────────────────────

const HiveRowWithStatus = ({ hive, selected, onSelect, onStatus }) => {
  const { latest, status } = useHiveWithLatest(hive)
  useEffect(() => { onStatus(hive.id, status, latest) }, [hive.id, status, latest, onStatus])
  return <HiveRow hive={hive} selected={selected} onClick={onSelect} status={status} latest={latest} />
}

// ── Map helpers ───────────────────────────────────────────────────────────────

const FlyToHive = ({ hive }) => {
  const map = useMap()
  useEffect(() => {
    if (hasGps(hive)) map.flyTo([hive.gps_lat, hive.gps_lng], 15, { duration: 1 })
  }, [hive, map])
  return null
}

const HiveMarkers = ({ hivesWithStatus, selected, onSelect }) => (
  <>
    {hivesWithStatus.map(({ hive, status }) => {
      if (!hasGps(hive)) return null
      const cfg        = getStatusCfg(status)
      const isSelected = selected?.id === hive.id
      return (
        <CircleMarker
          key={hive.id}
          center={[hive.gps_lat, hive.gps_lng]}
          radius={isSelected ? 14 : 10}
          pathOptions={{
            color: '#fff', weight: isSelected ? 3 : 2,
            fillColor: cfg.color, fillOpacity: isSelected ? 1 : 0.85,
          }}
          eventHandlers={{ click: () => onSelect(hive) }}
        >
          <Tooltip permanent={isSelected} direction="top" offset={[0, -12]}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{hive.name?.toUpperCase()}</span>
          </Tooltip>
        </CircleMarker>
      )
    })}
  </>
)

const Legend = () => (
  <div className="absolute top-3 right-3 z-[1000] bg-white/95 rounded-xl shadow-lg border border-gray-100 px-3 py-2.5">
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">LÉGENDE</p>
    <div className="flex items-center gap-3">
      {[{ label: 'Bon', color: '#22C55E' }, { label: 'Alerte', color: '#F59E0B' }, { label: 'Urgent', color: '#EF4444' }].map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[10px] text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  </div>
)

// ── No-GPS empty state overlaid on map ────────────────────────────────────────

const NoGpsOverlay = ({ total, withGps }) => {
  if (withGps > 0) return null
  return (
    <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
      <div className="bg-white/95 rounded-2xl shadow-xl border border-gray-100 px-8 py-6 text-center max-w-xs pointer-events-auto">
        <MapPinOff className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700 mb-1">Aucune coordonnée GPS</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          {total} ruche{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''} mais aucune n'a de
          coordonnées GPS enregistrées. Assignez des coordonnées via le backend pour les
          afficher sur la carte.
        </p>
      </div>
    </div>
  )
}

// ── Summary bar ───────────────────────────────────────────────────────────────

const SummaryBar = ({ hivesWithStatus }) => {
  const total   = hivesWithStatus.length
  const urgent  = hivesWithStatus.filter(h => ['urgente','urgent'].includes(h.status)).length
  const open    = hivesWithStatus.filter(h => h.latest?.door_open === true).length
  const withGps = hivesWithStatus.filter(h => hasGps(h.hive)).length

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-4 flex-wrap">
      <div className="text-center">
        <p className="text-base font-bold text-gray-800">{total}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
      </div>
      <div className="w-px h-7 bg-gray-200" />
      <div className="text-center">
        <p className="text-base font-bold text-blue-500">{open}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ouvert</p>
      </div>
      <div className="w-px h-7 bg-gray-200" />
      <div className="text-center">
        <p className="text-base font-bold text-red-500">{urgent}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Urgent</p>
      </div>
      <div className="w-px h-7 bg-gray-200 hidden sm:block" />
      <div className="hidden sm:block text-center">
        <p className="text-base font-bold text-green-500">{withGps}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">GPS</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const GestionMapPage = () => {
  const { apiculteurId } = useParams()
  const navigate         = useNavigate()

  const { data: hives = [], isLoading, refetch } = useHiveList(Number(apiculteurId))

  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('Toutes')
  const [selected,  setSelected]  = useState(null)
  const [statusMap, setStatusMap] = useState({})

  const updateStatus = useCallback((hiveId, status, latest) => {
    setStatusMap(prev => {
      if (prev[hiveId]?.status === status && prev[hiveId]?.latest === latest) return prev
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
    const q        = search.trim().toLowerCase()
    const labelMap = { 'Urgent': ['urgente','urgent'], 'Alerte': ['attention'], 'Normale': ['normale','normal','ok'] }
    return hivesWithStatus.filter(({ hive, status }) => {
      const matchSearch = !q || hive.name?.toLowerCase().includes(q) || hive.location_name?.toLowerCase().includes(q)
      const matchFilter = filter === 'Toutes' || (labelMap[filter] ?? []).includes(status)
      return matchSearch && matchFilter
    })
  }, [hivesWithStatus, search, filter])

  const gpsCount = useMemo(() => hives.filter(hasGps).length, [hives])

  const mapCenter = useMemo(() => {
    const geo = hives.filter(hasGps)
    if (!geo.length) return [30.5, -8.0]
    return [
      geo.reduce((s, h) => s + h.gps_lat, 0) / geo.length,
      geo.reduce((s, h) => s + h.gps_lng, 0) / geo.length,
    ]
  }, [hives])

  return (
    <div className="flex h-full overflow-hidden bg-[#FDFAF4]">

      {/* ── Left panel ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-hidden">

        <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Les ruches</h2>
            <div className="flex items-center gap-1.5">
              {gpsCount === 0 && !isLoading && (
                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                  GPS manquant
                </span>
              )}
              <button onClick={() => refetch()} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

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

          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors
                  ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mx-4 my-2 h-14 rounded-xl bg-gray-100 animate-pulse" />
              ))
            : filteredHives.length === 0
              ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-12 text-gray-300">
                  <Navigation className="w-7 h-7" />
                  <p className="text-sm">Aucune ruche trouvée</p>
                </div>
              )
              : filteredHives.map(({ hive }) => (
                  <HiveRowWithStatus
                    key={hive.id}
                    hive={hive}
                    selected={selected?.id === hive.id}
                    onSelect={() => setSelected(prev => prev?.id === hive.id ? null : hive)}
                    onStatus={updateStatus}
                  />
                ))
          }
        </div>

        <div className="flex-shrink-0">
          <SummaryBar hivesWithStatus={hivesWithStatus} />
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
            maxZoom={19}
          />
          <HiveMarkers hivesWithStatus={hivesWithStatus} selected={selected} onSelect={setSelected} />
          {selected && hasGps(selected) && <FlyToHive hive={selected} />}
          <Legend />
        </MapContainer>

        {/* No-GPS overlay */}
        <NoGpsOverlay total={hives.length} withGps={gpsCount} />

        {/* Selected hive card */}
        {selected && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[220px] max-w-[280px]">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-bold text-gray-900 text-sm">{selected.name?.toUpperCase()}</h3>
              <button
                onClick={() => navigate(`/apiculteurs/${apiculteurId}/gestion/${selected.id}`)}
                className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors flex-shrink-0"
              >
                Détails <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {hasGps(selected)
              ? <p className="text-[10px] text-gray-400 font-mono mb-1">
                  {selected.gps_lat.toFixed(5)}, {selected.gps_lng.toFixed(5)}
                </p>
              : <div className="flex items-center gap-1.5 mb-1">
                  <MapPinOff className="w-3 h-3 text-gray-300" />
                  <p className="text-[10px] text-gray-400">Coordonnées GPS manquantes</p>
                </div>
            }

            {selected.location_name && (
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <span className="text-[10px] text-gray-400 truncate">{selected.location_name}</span>
              </div>
            )}

            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-3 text-gray-300 hover:text-gray-500 text-lg leading-none transition"
            >×</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GestionMapPage