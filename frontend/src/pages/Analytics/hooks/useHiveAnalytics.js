import { useMemo } from 'react';
import { useHiveLatest, useHiveHistory, useHiveStats } from '../../../hooks/useHives';
import { voltsToPct, rssiToBars } from '../../Home/Hives/lib/hiveUtils';

export function useHiveAnalytics(hiveId) {
  const { data: latest,  isLoading: loadingLatest  } = useHiveLatest(hiveId);
  const { data: history, isLoading: loadingHistory } = useHiveHistory(hiveId, 200);
  const { data: stats,   isLoading: loadingStats   } = useHiveStats(hiveId);

  const isLoading = loadingLatest || loadingHistory;

  // ── Current readings ────────────────────────────────────────────────────────
  const temp     = latest?.temperature_c ?? null;
  const humidity = latest?.humidity_pct  ?? null;
  const sound    = latest?.sound_level   ?? null;
  const doorOpen = latest?.door_open     ?? null;
  const rssi     = latest?.rssi          ?? null;
  const battV    = latest?.battery_v     ?? null;
  const battPct  = voltsToPct(battV);
  const bars     = rssiToBars(rssi);

  // ── Comparative chart data (multi-line) ─────────────────────────────────────
  const chartData = useMemo(() =>
    (history ?? []).map(d => ({
      time          : (() => {
        try {
          const dt = new Date(d.ts);
          return `${String(dt.getHours()).padStart(2,'0')}h.${String(dt.getMinutes()).padStart(2,'0')}min`;
        } catch { return ''; }
      })(),
      'Température (°C)' : d.temperature_c != null ? +d.temperature_c.toFixed(1) : null,
      'Humidité (%)'     : d.humidity_pct  != null ? +d.humidity_pct.toFixed(1)  : null,
      'Niveau Sonore (Hz)': d.sound_level  != null ? +(d.sound_level * 2).toFixed(0) : null,
    })),
    [history]
  );

  // ── Per-metric min/max from history ────────────────────────────────────────
  const metricRanges = useMemo(() => {
    if (!history?.length) return { temp: null, humidity: null, sound: null };
    const temps  = history.map(d => d.temperature_c).filter(v => v != null);
    const hums   = history.map(d => d.humidity_pct).filter(v => v != null);
    const sounds = history.map(d => d.sound_level).filter(v => v != null);
    return {
      temp    : temps.length  ? { min: Math.min(...temps).toFixed(1),  max: Math.max(...temps).toFixed(1)  } : null,
      humidity: hums.length   ? { min: Math.min(...hums).toFixed(1),   max: Math.max(...hums).toFixed(1)   } : null,
      sound   : sounds.length ? { min: (Math.min(...sounds)*2).toFixed(0), max: (Math.max(...sounds)*2).toFixed(0) } : null,
    };
  }, [history]);

  // ── Signal label ────────────────────────────────────────────────────────────
  const signalLabel = bars >= 3 ? 'Fort' : bars >= 2 ? 'Moyen' : 'Faible';

  return {
    isLoading,
    // Raw
    temp, humidity, sound, doorOpen, rssi, battPct,
    // Derived
    signalLabel, bars,
    metricRanges,
    chartData,
    hasHistory: (history ?? []).length > 0,
    totalMeasurements: stats?.total_measurements ?? 0,
  };
}