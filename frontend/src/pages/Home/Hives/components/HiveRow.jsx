import React from 'react';
import { useHiveLatest } from '../../../../hooks/useHives'
import BatteryCell  from './BatteryCell';
import SignalCell from './SignalCell';
import SecurityCell from './SecurityCell';

const colorFor = (value, warnThreshold, critThreshold) => {
  if (value == null) return '';
  if (value > critThreshold)  return 'text-red-500 font-semibold';
  if (value > warnThreshold) return 'text-amber-500 font-semibold';
  return 'text-base-content';
};

const statusLabel = (temp, humidity, doorOpen) => {
  if (temp > 40 || humidity > 80 || doorOpen) return 'Urgente';
  if (temp > 35 || humidity > 70) return 'Attention';
  return 'Normale';
};

const HiveRow = ({ hive, onClick }) => {
  const { data: latest, isLoading } = useHiveLatest(hive.id);

  const temp      = latest?.temperature_c  ?? null;
  const humidity  = latest?.humidity_pct   ?? null;
  const sound     = latest?.sound_level    ?? null;
  const doorOpen  = latest?.door_open      ?? false;
  const rssi      = latest?.rssi           ?? null;
  const batteryV  = latest?.battery_v      ?? null;

  // Battery % — assume 4.2V = 100%, 3.3V = 0%
  const batteryPct = batteryV != null
    ? Math.min(100, Math.max(0, Math.round(((batteryV - 3.3) / 0.9) * 100)))
    : null;

  // Sound: display as Hz (scale 0-100 → 0-200Hz)
  const soundHz = sound != null ? `${sound * 2}Hz` : '—';

  const status  = temp != null ? statusLabel(temp, humidity, doorOpen) : 'Inconnue';
  const urgent  = status === 'Urgente';

  const statusStyle = urgent
    ? 'text-red-500 font-semibold'
    : status === 'Attention'
    ? 'text-amber-500 font-semibold'
    : 'text-base-content';

  const rowStyle = urgent
    ? 'bg-red-50 border-l-2 border-red-400'
    : 'border-l-2 border-transparent hover:bg-base-200/40';

  return (
    <tr
      className={`border-b border-base-200 transition-colors cursor-pointer ${rowStyle}`}
      onClick={() => onClick?.(hive)}
    >
      {/* RUCHE ID */}
      <td className="px-4 py-4 text-sm font-bold text-base-content tracking-wide">
        {hive.name?.toUpperCase() ?? hive.dev_eui?.slice(0, 8).toUpperCase()}
      </td>

      {/* ETAT */}
      <td className={`px-4 py-4 text-sm ${statusStyle}`}>
        {isLoading ? '…' : status}
      </td>

      {/* BATTERIE */}
      <td className="px-4 py-4">
        {isLoading ? (
          <span className="text-base-300 text-sm">…</span>
        ) : (
          <BatteryCell value={batteryPct} />
        )}
      </td>

      {/* SONORE */}
      <td className={`px-4 py-4 text-sm ${colorFor(sound, 60, 80)}`}>
        {isLoading ? '…' : soundHz}
      </td>

      {/* HUMIDITÉ */}
      <td className={`px-4 py-4 text-sm ${colorFor(humidity, 60, 75)}`}>
        {isLoading ? '…' : humidity != null ? `${Math.round(humidity)}%` : '—'}
      </td>

      {/* TEMPÉRATURE */}
      <td className={`px-4 py-4 text-sm ${colorFor(temp, 35, 40)}`}>
        {isLoading ? '…' : temp != null ? `${Math.round(temp)}°C` : '—'}
      </td>

      {/* SIGNAL */}
      <td className="px-4 py-4">
        {isLoading ? (
          <span className="text-base-300 text-sm">…</span>
        ) : (
          <SignalCell rssi={rssi} urgent={urgent} />
        )}
      </td>

      {/* SECURITÉ */}
      <td className="px-4 py-4">
        {isLoading ? (
          <span className="text-base-300 text-sm">…</span>
        ) : (
          <SecurityCell doorOpen={doorOpen} />
        )}
      </td>
    </tr>
  );
};

export default HiveRow;