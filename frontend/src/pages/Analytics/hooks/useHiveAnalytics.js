import { useMemo, useState } from 'react'
import { useHiveLatest, useHiveStats } from '../../../hooks/useHives'
import { useQuery } from '@tanstack/react-query'
import { getHiveHistory } from '../../../api/hives'
import { METRIC_CONFIG } from '../config/metricConfig'

const voltsToPct = (v) =>
  v != null ? Math.min(100, Math.max(0, Math.round(((v - 3.3) / 0.9) * 100))) : null

const rssiToLabel = (rssi) =>
  rssi == null ? 'Inconnu' : rssi >= -70 ? 'Fort' : rssi >= -85 ? 'Moyen' : 'Faible'

const rssiBars = (rssi) =>
  rssi == null ? 0 : rssi >= -70 ? 3 : rssi >= -85 ? 2 : 1

// Today as 'YYYY-MM-DD' in local time
const todayStr = () => new Date().toLocaleDateString('en-CA')

export function useHiveAnalytics(hiveId) {
  // ── Default to today ───────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(todayStr)

  const { data: latest, isLoading: ll } = useHiveLatest(hiveId)
  const { data: stats,  isLoading: ls } = useHiveStats(hiveId)

  // ── Fetch history for the selected date via API start/end params ───────────
  // This avoids fetching 2000 rows and filtering client-side
  const { data: history, isLoading: lh } = useQuery({
    queryKey    : ['hives', hiveId, 'history', selectedDate],
    queryFn     : () => {
      if (!selectedDate) {
        return getHiveHistory(hiveId, 200)
      }
      // Build start = midnight, end = end of day in UTC ISO strings
      const start = new Date(selectedDate + 'T00:00:00')
      const end   = new Date(selectedDate + 'T23:59:59')
      return getHiveHistory(hiveId, 5000, start.toISOString(), end.toISOString())
    },
    enabled     : !!hiveId,
    staleTime   : 30_000,
    refetchInterval: 60_000,
  })

  const isLoading = ll || lh

  const temp      = latest?.temperature_c ?? null
  const humidity  = latest?.humidity_pct  ?? null
  const sound     = latest?.sound_level   ?? null
  const doorOpen  = latest?.door_open     ?? null
  const rssi      = latest?.rssi          ?? null
  const battV     = latest?.battery_v     ?? null
  const battPct   = voltsToPct(battV)
  const bars      = rssiBars(rssi)
  const signalLabel = rssiToLabel(rssi)

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() =>
    (history ?? []).map(d => {
      const dt   = new Date(d.ts)
      const time = `${String(dt.getHours()).padStart(2,'0')}h.${String(dt.getMinutes()).padStart(2,'0')}min`
      return {
        time,
        rawHour : dt.getHours() + dt.getMinutes() / 60,  // for interval calculation
        [METRIC_CONFIG.temperature.chartKey] : d.temperature_c != null ? +d.temperature_c.toFixed(1) : null,
        [METRIC_CONFIG.humidity.chartKey]    : d.humidity_pct  != null ? +d.humidity_pct.toFixed(1)  : null,
        [METRIC_CONFIG.sound.chartKey]       : d.sound_level   != null ? +(d.sound_level * 2).toFixed(0) : null,
      }
    }),
    [history]
  )

  // ── Smart X-axis: pick ~8 evenly spaced ticks ─────────────────────────────
  const xAxisTicks = useMemo(() => {
    if (chartData.length < 2) return undefined   // let recharts decide
    const total    = chartData.length
    const step     = Math.max(1, Math.round(total / 8))
    return chartData
      .filter((_, i) => i % step === 0 || i === total - 1)
      .map(d => d.time)
  }, [chartData])

  // ── Min/max from history ───────────────────────────────────────────────────
  const metricRanges = useMemo(() => {
    if (!history?.length) return { temp: null, humidity: null, sound: null }
    const pick = (field, scale = v => v) => {
      const vals = (history ?? []).map(d => d[field]).filter(v => v != null).map(scale)
      return vals.length
        ? { min: Math.min(...vals).toFixed(1), max: Math.max(...vals).toFixed(1) }
        : null
    }
    return {
      temp    : pick('temperature_c'),
      humidity: pick('humidity_pct'),
      sound   : pick('sound_level', v => v * 2),
    }
  }, [history])

  // ── Excel export ───────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!history?.length) return

    const headers = ['Date/Heure', 'Température (°C)', 'Humidité (%)', 'Niveau Sonore (Hz)']
    const rows = (history ?? []).map(d => [
      new Date(d.ts).toLocaleString('fr-FR'),
      d.temperature_c?.toFixed(1) ?? '',
      d.humidity_pct?.toFixed(1)  ?? '',
      d.sound_level != null ? (d.sound_level * 2).toFixed(0) : '',
    ])

    const csv  = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `IBEE_ruche_${hiveId}_${selectedDate || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    isLoading,
    temp, humidity, sound, doorOpen, rssi, battPct, bars, signalLabel,
    metricRanges,
    chartData,
    xAxisTicks,
    hasHistory        : (history ?? []).length > 0,
    totalMeasurements : stats?.total_measurements ?? 0,
    selectedDate, setSelectedDate,
    exportExcel,
  }
}