import React from 'react';
import { X, MapPin, Cpu } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useHiveModal } from '../hooks/useHiveModal';
import BatteryCell from './BatteryCell';
import SignalCell   from './SignalCell';
import SecurityCell from './SecurityCell';

// ── Pure icon components ──────────────────────────────────────────────────────

const TempIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"
      stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HumidityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#3B82F6">
    <path d="M12 2C6 10 4 14 4 16a8 8 0 0 0 16 0c0-2-2-6-8-14Z"/>
  </svg>
);

const SoundIcon = () => (
  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
    <rect width="2" height="8" rx="0.73" fill="#3DA35D"/>
    <rect x="2.18" y="1.45" width="1.45" height="5.09" rx="0.73" fill="#3DA35D"/>
    <rect x="4.36" width="1.45" height="8" rx="0.73" fill="#3DA35D"/>
    <rect x="6.55" y="1.45" width="1.45" height="5.09" rx="0.73" fill="#D9D9D9"/>
    <rect x="8.73" width="1.45" height="8" rx="0.73" fill="#D9D9D9"/>
  </svg>
);

// ── Reusable sub-components ───────────────────────────────────────────────────

const SectionLabel = ({ icon, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-xs font-bold text-gray-500 tracking-[0.1em] uppercase">{label}</span>
    {icon && <span className="flex items-center">{icon}</span>}
    <div className="flex-1 h-px bg-gray-100 ml-1" />
  </div>
);

const MeasureValue = ({ value, unit, color = 'text-gray-800', loading }) => {
  if (loading) return <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />;
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value ?? '—'}</span>
      {value != null && unit && <span className="text-sm text-gray-400">{unit}</span>}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toFixed(1)}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Main modal — purely presentational ───────────────────────────────────────

const HiveModal = ({ hive, onClose }) => {
  const {
    loadingLatest,
    loadingHistory,
    temp,     tempColor,
    humidity, humColor,
    soundHz,
    doorOpen,
    rssi,
    battPct,
    lastSeenAt,
    deviceEui,
    chartData,
    chartKey,
    hasHistory,
  } = useHiveModal(hive.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10 bg-black/25 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                   w-full max-w-[660px] max-h-[90vh] overflow-y-auto
                   bg-white rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4">
          <div className="flex items-center gap-3">
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
              {(hive.location_name || deviceEui) && (
                <div className="flex items-center gap-3 mt-0.5">
                  {hive.location_name && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {hive.location_name}
                    </span>
                  )}
                  {deviceEui && (
                    <span className="flex items-center gap-1 text-xs text-gray-300">
                      <Cpu className="w-3 h-3" />
                      {deviceEui}
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

        <div className="px-8 pb-8 flex flex-col gap-7">

          {/* Measurements */}
          <div className='mt-5'>
            <SectionLabel label="Mesures" />
            <div className="grid grid-cols-3 gap-10">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <TempIcon />
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Température</p>
                </div>
                <MeasureValue value={temp?.toFixed(1)} unit="°C" color={tempColor} loading={loadingLatest} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <HumidityIcon />
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Humidité</p>
                </div>
                <MeasureValue value={humidity?.toFixed(1)} unit="%" color={humColor} loading={loadingLatest} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 mt-1">
                  <SoundIcon />
                  <p className="text-xs text-gray-400 uppercase tracking-wide ml-1">Sonore</p>
                </div>
                <MeasureValue value={soundHz} unit="" loading={loadingLatest} />
              </div>
            </div>
          </div>

          {/* Device info */}
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
                    {rssi != null && <span className="text-sm text-gray-500">{rssi} dBm</span>}
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

          {/* Chart */}
          <div>
            <SectionLabel label="Historique" />
            {loadingHistory ? (
              <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
            ) : !hasHistory ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-300 bg-gray-50 rounded-xl">
                Pas encore de données historiques
              </div>
            ) : (
              <ResponsiveContainer key={chartKey} width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                  <Line type="monotone" dataKey="Temp (°C)"    stroke="#F97316" strokeWidth={2} dot={false} connectNulls activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Humidité (%)" stroke="#38BDF8" strokeWidth={2} dot={false} connectNulls activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {lastSeenAt && (
              <p className="text-xs text-gray-300 text-right mt-5">
                Dernière mesure : {lastSeenAt}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HiveModal;