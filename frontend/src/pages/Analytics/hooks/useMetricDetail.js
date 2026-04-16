import { useState, useMemo } from 'react';
import { useHiveHistory } from '../../../hooks/useHives';

/**
 * useMetricDetail — owns all data for MetricDetailPage.
 *
 * @param {number}  hiveId
 * @param {'temperature'|'humidity'|'sound'} metric
 */
export function useMetricDetail(hiveId, metric) {
  const [range, setRange]   = useState('7j'); // 'J' | '7j' | 'Mois'
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const limit = range === 'J' ? 100 : range === '7j' ? 500 : 2000;

  const { data: history, isLoading } = useHiveHistory(hiveId, limit);

  // ── Extract the right field ──────────────────────────────────────────────
  const field = {
    temperature : 'temperature_c',
    humidity    : 'humidity_pct',
    sound       : 'sound_level',
  }[metric] ?? 'temperature_c';

  const unit = { temperature: '°C', humidity: '%', sound: 'Hz' }[metric] ?? '';

  // Alert thresholds (matches backend THRESHOLDS)
  const alertThreshold = { temperature: 38, humidity: 75, sound: 70 }[metric];

  // ── Scale raw value to display unit ────────────────────────────────────────
  const scale = metric === 'sound' ? (v) => v * 2 : (v) => v;

  // ── Filtered + scaled values ────────────────────────────────────────────────
  const values = useMemo(() => {
    if (!history?.length) return [];
    let data = history;
    if (startDate) data = data.filter(d => new Date(d.ts) >= new Date(startDate));
    if (endDate)   data = data.filter(d => new Date(d.ts) <= new Date(endDate));
    return data
      .filter(d => d[field] != null)
      .map(d => ({ raw: d[field], scaled: scale(d[field]), ts: d.ts }));
  }, [history, field, startDate, endDate, metric]);

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const scaledValues = values.map(v => v.scaled);
  const avg     = scaledValues.length ? scaledValues.reduce((a,b) => a+b, 0) / scaledValues.length : null;
  const max     = scaledValues.length ? Math.max(...scaledValues) : null;
  const min     = scaledValues.length ? Math.min(...scaledValues) : null;
  const alerts  = values.filter(v => v.raw >= alertThreshold).length;

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = useMemo(() =>
    values.map(v => {
      const dt = new Date(v.ts);
      const dateLabel = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;
      const timeLabel = `${dateLabel}, ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
      return {
        time  : dateLabel,
        tooltip: timeLabel,
        value  : +v.scaled.toFixed(1),
      };
    }),
    [values]
  );

  return {
    isLoading,
    unit,
    range, setRange,
    startDate, setStartDate,
    endDate,   setEndDate,
    // Stats
    avg  : avg  != null ? +avg.toFixed(1)  : null,
    max  : max  != null ? +max.toFixed(1)  : null,
    min  : min  != null ? +min.toFixed(1)  : null,
    alerts,
    // Chart
    chartData,
    hasData: chartData.length > 0,
  };
}