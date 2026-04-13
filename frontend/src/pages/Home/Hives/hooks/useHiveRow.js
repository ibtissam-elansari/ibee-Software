import { useHiveLatest } from '../../../../hooks/useHives';
import {
  voltsToPct,
  soundToHz,
  deriveStatus,
  thresholdColor,
  statusColor,
} from '../lib/hiveUtils';

/**
 * useHiveRow — encapsulates ALL logic for a single hive table row.
 *
 * The component (HiveRow) calls this hook and receives display-ready values.
 * HiveRow itself contains zero business logic — only JSX.
 *
 * @param {number} hiveId
 * @returns {{
 *   isLoading: boolean,
 *   display: {
 *     name: string,
 *     status: string,
 *     statusColor: string,
 *     batteryPct: number|null,
 *     soundHz: string,
 *     temp: number|null,
 *     tempColor: string,
 *     humidity: number|null,
 *     humidityColor: string,
 *     soundColor: string,
 *     rssi: number|null,
 *     doorOpen: boolean|null,
 *     urgent: boolean,
 *     rowBg: string,
 *     leftAccent: string,
 *   }
 * }}
 */
export function useHiveRow(hiveId) {
  const { data: latest, isLoading } = useHiveLatest(hiveId);

  // ── Raw values ──────────────────────────────────────────────────────────────
  const temp      = latest?.temperature_c ?? null;
  const humidity  = latest?.humidity_pct  ?? null;
  const sound     = latest?.sound_level   ?? null;
  const doorOpen  = latest?.door_open     ?? null;
  const rssi      = latest?.rssi          ?? null;
  const batteryV  = latest?.battery_v     ?? null;

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