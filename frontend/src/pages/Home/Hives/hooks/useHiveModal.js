import { useMemo } from 'react';
import { useHiveLatest, useHiveHistory } from '../../../../hooks/useHives';
import { voltsToPct, thresholdColor, formatTime } from '../lib/hiveUtils';

/**
 * useHiveModal — all data + derived values for the hive detail modal.
 *
 * HiveModal becomes a pure render component — it only decides what to show,
 * this hook decides what the values mean.
 */
export function useHiveModal(hiveId) {
  const { data: latest,  isLoading: loadingLatest  } = useHiveLatest(hiveId);
  const { data: history, isLoading: loadingHistory } = useHiveHistory(hiveId, 50);

  // ── Raw values ──────────────────────────────────────────────────────────────
  const temp     = latest?.temperature_c ?? null;
  const humidity = latest?.humidity_pct  ?? null;
  const sound    = latest?.sound_level   ?? null;
  const doorOpen = latest?.door_open     ?? null;
  const rssi     = latest?.rssi          ?? null;
  const snr      = latest?.snr           ?? null;
  const battV    = latest?.battery_v     ?? null;

  // ── Derived ─────────────────────────────────────────────────────────────────
  const battPct     = voltsToPct(battV);
  const soundHz     = sound != null ? sound * 2 : null;
  const tempColor   = thresholdColor(temp, 35, 40, 'text-gray-800');
  const humColor    = thresholdColor(humidity, 70, 80, 'text-gray-800');
  const lastSeenAt  = formatTime(latest?.ts);

  // Chart data — transformed here, not inside the component
  const chartData = useMemo(() =>
    (history ?? []).map(d => ({
      time          : formatTime(d.ts).slice(0, 5), // HH:mm only
      'Temp (°C)'   : d.temperature_c != null ? +d.temperature_c.toFixed(1) : null,
      'Humidité (%)': d.humidity_pct  != null ? +d.humidity_pct.toFixed(1)  : null,
    })),
    [history]
  );

  // Key that forces recharts to remount on new data (avoids stale animation)
  const chartKey = `chart-${hiveId}-${history?.length ?? 0}-${latest?.ts ?? ''}`;

  return {
    loadingLatest,
    loadingHistory,

    // Measurements
    temp,     tempColor,
    humidity, humColor,
    soundHz,
    sound,

    // Device info
    doorOpen,
    rssi,
    snr,
    battPct,

    // Meta
    lastSeenAt,
    deviceEui: latest?.device_dev_eui ?? null,

    // Chart
    chartData,
    chartKey,
    hasHistory: chartData.length > 0,
  };
}