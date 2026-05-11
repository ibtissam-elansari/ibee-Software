import React from 'react'
import { useHiveLatest } from '../../../../hooks/useHives'
import BatteryCell  from './BatteryCell'
import SignalCell   from './SignalCell'
import SecurityCell from './SecurityCell'
import HiveStateBadge from './HiveStateBadge'

const STATUS_STYLES = {
  Urgente  : { label: 'Urgent',    className: 'text-red-500   bg-red-50   border-red-200'   },
  Attention: { label: 'Attention', className: 'text-amber-500 bg-amber-50 border-amber-200' },
  Normale  : { label: 'Normale',   className: 'text-green-600 bg-green-50 border-green-200' },
}

const CARD_BORDER = {
  Urgente  : 'border-red-300   bg-red-50/30',
  Attention: 'border-amber-300 bg-amber-50/20',
  Normale  : 'border-gray-200  bg-white',
}

const Stat = ({ label, value, alert = false, loading = false }) => (
  <div className="flex flex-col min-w-0">
    <p className="text-[9px] font-semibold tracking-widest text-gray-400 mb-0.5 truncate">{label}</p>
    {loading
      ? <div className="h-5 w-12 bg-gray-100 rounded animate-pulse mt-1" />
      : <p className={`text-base font-semibold truncate ${alert ? 'text-red-500' : 'text-gray-800'}`}>
          {value ?? '—'}
        </p>
    }
  </div>
)

const HiveCard = ({ hive, onHiveClick }) => {
  const { data: latest, isLoading } = useHiveLatest(hive.id)

  const temp     = latest?.temperature_c ?? null
  const humidity = latest?.humidity_pct  ?? null
  const sound    = latest?.sound_level   ?? null
  const doorOpen = latest?.door_open     ?? null
  const rssi     = latest?.rssi          ?? null
  const battV    = latest?.battery_v     ?? null
  const weight   = latest?.weight_kg     ?? null

  const battPct = battV != null
    ? Math.min(100, Math.max(0, Math.round(((battV - 3.3) / 0.9) * 100)))
    : null

  const status =
    temp > 40 || humidity > 80 || doorOpen === true ? 'Urgente'   :
    temp > 35 || humidity > 70                       ? 'Attention' :
    'Normale'

  const style = STATUS_STYLES[status]
  const card  = CARD_BORDER[status]

  return (
    <div
      onClick={() => onHiveClick(hive)}
      className={`rounded-xl border p-3 cursor-pointer
        hover:shadow-md transition-all duration-200 ${card}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-1 min-w-0">
        <span className="text-xs font-bold text-gray-800 tracking-wide truncate">
          {hive.name?.toUpperCase()}
        </span>
        <HiveStateBadge state={latest?.hive_state} confidence={latest?.ai_confidence} size="xs" />
        <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${style.className}`}>
          {style.label}
        </span>
      </div>

      {/* Stats — 2×2 grid so values never run together */}
      <div >
        <div className='flex flex-row justify-around mb-4'>
          <Stat
            label="TEMP"
            value={temp != null ? `${temp.toFixed(1)}°C` : null}
            alert={temp > 40}
            loading={isLoading}
          />
          <Stat
            label="HUMIDITÉ"
            value={humidity != null ? `${humidity.toFixed(0)}%` : null}
            alert={humidity > 80}
            loading={isLoading}
          />
        </div>

        <div className='flex flex-row justify-around mb-4'>
          <Stat
            label="SONORE"
            value={sound != null ? `${sound * 2}Hz` : null}
            alert={sound > 80}
            loading={isLoading}
          />
          <Stat
            label="POIDS"
            value={weight != null ? `${weight.toFixed(1)}kg` : null}
            alert={weight < 10}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Footer row */}
      {!isLoading && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <BatteryCell value={battPct} />
          <div className="flex items-center gap-2">
            <SignalCell rssi={rssi} urgent={status === 'Urgente'} />
            <SecurityCell doorOpen={doorOpen} />
          </div>
        </div>
      )}
    </div>
  )
}

const HiveGrid = ({ hives, onHiveClick }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
    {hives.map(hive => (
      <HiveCard key={hive.id} hive={hive} onHiveClick={onHiveClick} />
    ))}
  </div>
)

export default HiveGrid