import { useHiveLatest } from '../../../../hooks/useHives';
import {
  voltsToPct,
  soundToHz,
  deriveStatus,
  thresholdColor,
  statusColor,
} from '../lib/hiveUtils';

export function useHiveRow(hiveId, latestProp = null) {
  const { data: latestFetched, isLoading: fetchLoading } = useHiveLatest(hiveId, {
    enabled: !latestProp,   // skip fetch if parent already provides data
  });

  const latest   = latestProp ?? latestFetched;
  const isLoading = !latestProp && fetchLoading;

  // ── Raw values ──────────────────────────────────────────────────────────────
  const temp     = latest?.temperature_c ?? null;
  const humidity = latest?.humidity_pct  ?? null;
  const sound    = latest?.sound_level   ?? null;
  const doorOpen = latest?.door_open     ?? null;
  const rssi     = latest?.rssi          ?? null;
  const batteryV = latest?.battery_v     ?? null;

  // ── Derived display values ──────────────────────────────────────────────────
  const batteryPct = voltsToPct(batteryV);
  const soundHz    = soundToHz(sound);
  const status     = deriveStatus(temp, humidity, sound, doorOpen);
  const urgent     = status === 'Urgente';

  return {
    isLoading,
    display: {
      status,
      statusColor : statusColor(status),
      batteryPct,
      soundHz,
      temp,
      tempColor     : thresholdColor(temp, 35, 40),
      humidity,
      humidityColor : thresholdColor(humidity, 60, 75),
      soundColor    : thresholdColor(sound, 60, 80),
      rssi,
      doorOpen,
      urgent,
      rowBg: urgent
        ? 'bg-red-50 border border-red-300 rounded-xl'
        : 'border border-transparent hover:bg-gray-50',
    },
  };
}