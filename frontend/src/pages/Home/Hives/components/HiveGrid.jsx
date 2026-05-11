import React from 'react'
import { useHiveRow }      from '../hooks/useHiveRow'
import BatteryCell         from './BatteryCell'
import SignalCell          from './SignalCell'
import SecurityCell        from './SecurityCell'
import HiveStateBadge      from './HiveStateBadge'

const STATUS_STYLES = {
  Urgent    : { className: 'text-red-500   bg-red-50   border-red-200'   },
  Attention : { className: 'text-amber-500 bg-amber-50 border-amber-200' },
  Normale   : { className: 'text-green-600 bg-green-50 border-green-200' },
}

const CARD_BORDER = {
  Urgent    : 'border-red-300   bg-red-50/30',
  Attention : 'border-amber-300 bg-amber-50/20',
  Normale   : 'border-gray-200  bg-white',
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
  const { isLoading, display, latest } = useHiveRow(hive.id)

  const style  = STATUS_STYLES[display.status] ?? STATUS_STYLES.Normale
  const card   = CARD_BORDER[display.status]   ?? CARD_BORDER.Normale

  return (
    <div
      onClick={() => onHiveClick(hive)}
      className={`rounded-xl border p-3 cursor-pointer
        hover:shadow-md transition-all duration-200 ${card}`}
    >
      {/* Header — status badge + AI badge */}
      <div className="flex items-center justify-between mb-3 gap-1 min-w-0">
        <span className="text-xs font-bold text-gray-800 tracking-wide truncate">
          {hive.name?.toUpperCase()}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
          <HiveStateBadge
            state={display.hive_state}
            confidence={display.ai_confidence}
            size="xs"
          />
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${style.className}`}>
            {display.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="flex flex-row justify-around mb-4">
          <Stat
            label="TEMP"
            value={display.temp != null ? `${display.temp.toFixed(1)}°C` : null}
            alert={display.tempColor === 'text-red-500'}
            loading={isLoading}
          />
          <Stat
            label="HUMIDITÉ"
            value={display.humidity != null ? `${display.humidity.toFixed(0)}%` : null}
            alert={display.humidityColor === 'text-red-500'}
            loading={isLoading}
          />
        </div>
        <div className="flex flex-row justify-around mb-4">
          <Stat
            label="SONORE"
            value={display.soundHz}
            alert={display.soundColor === 'text-red-500'}
            loading={isLoading}
          />
          <Stat
            label="POIDS"
            value={display.weight != null ? `${display.weight.toFixed(1)}kg` : null}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Footer */}
      {!isLoading && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <BatteryCell value={display.batteryPct} />
          <div className="flex items-center gap-2">
            <SignalCell   rssi={display.rssi}       urgent={display.urgent} />
            <SecurityCell doorOpen={display.doorOpen} />
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