import React, { useMemo } from 'react'
import { X, MapPin, Cpu } from 'lucide-react'
import { useHiveLatest, useHiveHistory } from '../../../../hooks/useHives'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import BatteryCell  from './BatteryCell'
import SignalCell   from './SignalCell'
import SecurityCell from './SecurityCell'

// ── Icons matching the Figma inline label style ───────────────────────────────

const TempIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"
      stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const HumidityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#3B82F6">
    <path d="M12 2C6 10 4 14 4 16a8 8 0 0 0 16 0c0-2-2-6-8-14Z"/>
  </svg>
)

const SoundIcon = () => (
  <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="2" height="8" rx="0.727273" fill="#3DA35D"/>
    <rect x="2.18188" y="1.45453" width="1.45455" height="5.09091" rx="0.727273" fill="#3DA35D"/>
    <rect x="4.36353" width="1.45455" height="8" rx="0.727273" fill="#3DA35D"/>
    <rect x="6.54541" y="1.45453" width="1.45455" height="5.09091" rx="0.727273" fill="#D9D9D9"/>
    <rect x="8.72729" width="1.45455" height="8" rx="0.727273" fill="#D9D9D9"/>
  </svg>
)

const BatteryIcon = () => (
  <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
    <rect x="0.5" y="0.5" width="13" height="9" rx="1.5" stroke="#F59E0B" strokeWidth="1"/>
    <rect x="14" y="3" width="1.5" height="4" rx="0.5" fill="#F59E0B"/>
    <rect x="1.5" y="1.5" width="8" height="7" rx="1" fill="#F59E0B"/>
  </svg>
)

const SignalIcon = () => (
  <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
    <rect x="0"  y="8"  width="3" height="6" rx="1" fill="#6366F1"/>
    <rect x="4.5" y="5" width="3" height="9" rx="1" fill="#6366F1"/>
    <rect x="9"  y="2"  width="3" height="12" rx="1" fill="#6366F1"/>
    <rect x="13.5" y="0" width="3" height="14" rx="1" fill="#E5E7EB"/>
  </svg>
)

// ── Section separator with inline label ──────────────────────────────────────

const SectionLabel = ({ icon, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-sm font-bold text-gray-800 tracking-wide">{label}</span>
    <span className="flex items-center">{icon}</span>
    <div className="flex-1 h-px bg-gray-100 ml-1" />
  </div>
)

// ── Measurement value display ─────────────────────────────────────────────────

const MeasureValue = ({ value, unit, color = 'text-gray-800', loading }) => {
  if (loading) return (
    <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
  )
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-bold ${color}`}>
        {value ?? '—'}
      </span>
      {value != null && unit && (
        <span className="text-sm text-gray-400">{unit}</span>
      )}
    </div>
  )
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toFixed(1)}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

const HiveModal = ({ hive, onClose }) => {
  const { data: latest,  isLoading: loadingLatest  } = useHiveLatest(hive.id)
  const { data: history, isLoading: loadingHistory } = useHiveHistory(hive.id, 50)

  const temp     = latest?.temperature_c ?? null
  const humidity = latest?.humidity_pct  ?? null
  const sound    = latest?.sound_level   ?? null
  const doorOpen = latest?.door_open     ?? null
  const rssi     = latest?.rssi          ?? null
  const snr      = latest?.snr           ?? null
  const battV    = latest?.battery_v     ?? null
  const battPct  = battV != null
    ? Math.min(100, Math.max(0, Math.round(((battV - 3.3) / 0.9) * 100)))
    : null

  const tempColor =
    temp > 40 ? 'text-red-500' :
    temp > 35 ? 'text-amber-500' : 'text-gray-800'

  const humColor =
    humidity > 80 ? 'text-red-500' :
    humidity > 70 ? 'text-amber-500' : 'text-gray-800'

  // Chart — key forces remount (reinitialise) whenever history updates
  const chartKey = useMemo(
    () => `chart-${hive.id}-${history?.length ?? 0}-${latest?.ts ?? ''}`,
    [hive.id, history, latest]
  )

  const chartData = useMemo(() =>
    (history ?? []).map(d => ({
      time         : (() => { try { return format(parseISO(d.ts), 'HH:mm', { locale: fr }) } catch { return '' } })(),
      'Temp (°C)'  : d.temperature_c != null ? +d.temperature_c.toFixed(1) : null,
      'Humidité (%)': d.humidity_pct  != null ? +d.humidity_pct.toFixed(1)  : null,
    })),
    [history]
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
          w-full max-w-[660px] max-h-[90vh] overflow-y-auto
          bg-white rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5">
          <div className="flex items-center gap-3">
            {/* Amber circle icon — matches the + circle in "Ajouter" modal */}
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 43 43" fill="none">
                <path d="M11.5212 21.3061L14.0225 16.9719H19.0279L21.5297 21.3061L19.0273 25.6403H14.022L11.5212 21.3061ZM21.0823 26.826L23.5831 22.4918H28.5884L31.0908 26.826L28.5884 31.1602H23.5831L21.0823 26.826ZM21.0823 15.7863L23.5826 11.4521H28.5879L31.0903 15.7863L28.5879 20.1204H23.5826L21.0823 15.7863Z"
                  fill="#F59E0B"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {hive.name?.toUpperCase() ?? '—'}
              </h2>
              {(hive.location_name || latest?.device_dev_eui) && (
                <div className="flex items-center gap-3 mt-0.5">
                  {hive.location_name && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {hive.location_name}
                    </span>
                  )}
                  {latest?.device_dev_eui && (
                    <span className="flex items-center gap-1 text-xs text-gray-300">
                      <Cpu className="w-3 h-3" />
                      {latest.device_dev_eui}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center
              text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MEASUREMENTS */}
        <div className="px-8 pb-8 flex flex-col gap-7 mt-5">
          <div>
            <SectionLabel label="MEASUREMENTS" />
            <div className="grid grid-cols-3 gap-10">
              <div className="flex flex-col gap-1">
                <div className='flex flex-row gap-1'>
                  <TempIcon />
                  <p className="text-xs text-gray-400 uppercase tracking-wide">TEMPÉRATURE</p>
                </div>
                <MeasureValue
                  value={temp?.toFixed(1)}
                  unit="°C"
                  color={tempColor}
                  loading={loadingLatest}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className='flex flex-row gap-1'>
                  <HumidityIcon />
                  <p className="text-xs text-gray-400 uppercase tracking-wide">HUMIDITÉ</p>
                </div>
                <MeasureValue
                  value={humidity?.toFixed(1)}
                  unit="%"
                  color={humColor}
                  loading={loadingLatest}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className='flex flex-row gap-1'>
                  <div className='mt-1'><SoundIcon/></div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">SONORE</p>
                </div>
                <MeasureValue
                  value={sound != null ? sound * 2 : null}
                  unit="Hz"
                  color={sound > 80 ? 'text-red-500' : sound > 60 ? 'text-amber-500' : 'text-gray-800'}
                  loading={loadingLatest}
                />
              </div>
            </div>
          </div>

          {/* ── Batterie + Signal + Sécurité ── */}
          <div className='mt-2'>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Batterie</p>
                {loadingLatest
                  ? <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
                  : <BatteryCell value={battPct} />
                }
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Signal RSSI</p>
                {loadingLatest
                  ? <div className="h-6 w-12 bg-gray-100 rounded animate-pulse" />
                  : (
                    <div className="flex items-center gap-2">
                      <SignalCell rssi={rssi} />
                      {rssi != null && (
                        <span className="text-sm text-gray-500">{rssi} dBm</span>
                      )}
                    </div>
                  )
                }
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Sécurité</p>
                {loadingLatest
                  ? <div className="h-6 w-10 bg-gray-100 rounded animate-pulse" />
                  : (
                    <div className="flex items-center gap-2">
                      <SecurityCell doorOpen={doorOpen} />
                      <span className="text-sm text-gray-500">
                        {doorOpen == null ? '—' : doorOpen ? 'Ouverte' : 'Fermée'}
                      </span>
                    </div>
                  )
                }
              </div>
            </div>
          </div>

          {/* ── Chart ── */}
          <div className='mt-2'>
            <SectionLabel
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12l4-4 4 4 4-6 4 6" stroke="#6366F1" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              label="HISTORIQUE"
            />

            {loadingHistory ? (
              <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
            ) : chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center
                text-sm text-gray-300 bg-gray-50 rounded-xl">
                Pas encore de données historiques
              </div>
            ) : (
              // key forces full remount → recharts reinitialises animations on new data
              <ResponsiveContainer key={chartKey} width="100%" height={200}>
                <LineChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    interval="preserveStartEnd"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Temp (°C)"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    activeDot={{ r: 4, fill: '#F97316' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Humidité (%)"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    activeDot={{ r: 4, fill: '#38BDF8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {/* Last update timestamp */}
            {latest?.ts && (
              <p className="text-xs text-gray-300 text-right mt-5">
                Dernière mesure :{' '}
                {(() => {
                  try { return format(parseISO(latest.ts), 'HH:mm:ss', { locale: fr }) }
                  catch { return '' }
                })()}
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

export default HiveModal