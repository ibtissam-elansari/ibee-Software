import { useMemo }  from 'react'
import { useHiveLatest, useHiveHistory, useHiveStats } from '../../../hooks/useHives'
import { METRIC_CONFIG } from '../config/metricConfig'

const voltsToPct = (v) =>
  v != null ? Math.min(100, Math.max(0, Math.round(((v - 3.3) / 0.9) * 100))) : null

const rssiToLabel = (rssi) =>
  rssi == null ? 'Inconnu' : rssi >= -70 ? 'Fort' : rssi >= -85 ? 'Moyen' : 'Faible'

const rssiBars = (rssi) =>
  rssi == null ? 0 : rssi >= -70 ? 3 : rssi >= -85 ? 2 : 1

export function useHiveAnalytics(hiveId) {
  const { data: latest,  isLoading: ll } = useHiveLatest(hiveId)
  const { data: history, isLoading: lh } = useHiveHistory(hiveId, 200)
  const { data: stats,   isLoading: ls } = useHiveStats(hiveId)

  const isLoading = ll || lh

  const temp     = latest?.temperature_c ?? null
  const humidity = latest?.humidity_pct  ?? null
  const sound    = latest?.sound_level   ?? null
  const doorOpen = latest?.door_open     ?? null
  const rssi     = latest?.rssi          ?? null
  const battV    = latest?.battery_v     ?? null
  const battPct  = voltsToPct(battV)
  const bars     = rssiBars(rssi)
  const signalLabel = rssiToLabel(rssi)

  const chartData = useMemo(() =>
    (history ?? []).map(d => {
      const dt = new Date(d.ts)
      const time = `${String(dt.getHours()).padStart(2,'0')}h.${String(dt.getMinutes()).padStart(2,'0')}min`
      return {
        time,
        [METRIC_CONFIG.temperature.chartKey] : d.temperature_c != null ? +d.temperature_c.toFixed(1) : null,
        [METRIC_CONFIG.humidity.chartKey]    : d.humidity_pct  != null ? +d.humidity_pct.toFixed(1)  : null,
        [METRIC_CONFIG.sound.chartKey]       : d.sound_level   != null ? +(d.sound_level * 2).toFixed(0) : null,
      }
    }),
    [history]
  )

  const metricRanges = useMemo(() => {
    if (!history?.length) return { temp: null, humidity: null, sound: null }
    const pick = (field, scale = v => v) => {
      const vals = history.map(d => d[field]).filter(v => v != null).map(scale)
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

  return {
    isLoading,
    temp, humidity, sound, doorOpen, rssi, battPct, bars, signalLabel,
    metricRanges,
    chartData,
    hasHistory    : (history ?? []).length > 0,
    totalMeasurements: stats?.total_measurements ?? 0,
  }
}