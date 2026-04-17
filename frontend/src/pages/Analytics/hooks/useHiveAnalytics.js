import { useMemo, useState } from 'react'
import { useHiveLatest, useHiveHistory, useHiveStats } from '../../../hooks/useHives'
import { METRIC_CONFIG } from '../config/metricConfig'

const voltsToPct = (v) =>
  v != null ? Math.min(100, Math.max(0, Math.round(((v - 3.3) / 0.9) * 100))) : null

const rssiToLabel = (rssi) =>
  rssi == null ? 'Inconnu' : rssi >= -70 ? 'Fort' : rssi >= -85 ? 'Moyen' : 'Faible'

const rssiBars = (rssi) =>
  rssi == null ? 0 : rssi >= -70 ? 3 : rssi >= -85 ? 2 : 1

export function useHiveAnalytics(hiveId) {
  // ── Date filter state lives here so the page stays clean ──────────────────
  const [selectedDate, setSelectedDate] = useState('')   // 'YYYY-MM-DD' or ''

  const { data: latest,  isLoading: ll } = useHiveLatest(hiveId)
  const { data: history, isLoading: lh } = useHiveHistory(hiveId, 2000)
  const { data: stats,   isLoading: ls } = useHiveStats(hiveId)

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

  // ── Filter history by selected date ───────────────────────────────────────
  const filteredHistory = useMemo(() => {
    if (!history?.length) return []
    if (!selectedDate)    return history

    // selectedDate is 'YYYY-MM-DD' — keep only rows from that calendar day
    return history.filter(d => {
      const rowDate = new Date(d.ts).toLocaleDateString('en-CA') // 'YYYY-MM-DD'
      return rowDate === selectedDate
    })
  }, [history, selectedDate])

  // ── Chart data from filtered history ──────────────────────────────────────
  const chartData = useMemo(() =>
    filteredHistory.map(d => {
      const dt   = new Date(d.ts)
      const time = `${String(dt.getHours()).padStart(2,'0')}h.${String(dt.getMinutes()).padStart(2,'0')}min`
      return {
        time,
        [METRIC_CONFIG.temperature.chartKey] : d.temperature_c != null ? +d.temperature_c.toFixed(1) : null,
        [METRIC_CONFIG.humidity.chartKey]    : d.humidity_pct  != null ? +d.humidity_pct.toFixed(1)  : null,
        [METRIC_CONFIG.sound.chartKey]       : d.sound_level   != null ? +(d.sound_level * 2).toFixed(0) : null,
      }
    }),
    [filteredHistory]
  )

  // ── Min/max from filtered history ─────────────────────────────────────────
  const metricRanges = useMemo(() => {
    if (!filteredHistory.length) return { temp: null, humidity: null, sound: null }
    const pick = (field, scale = v => v) => {
      const vals = filteredHistory.map(d => d[field]).filter(v => v != null).map(scale)
      return vals.length
        ? { min: Math.min(...vals).toFixed(1), max: Math.max(...vals).toFixed(1) }
        : null
    }
    return {
      temp    : pick('temperature_c'),
      humidity: pick('humidity_pct'),
      sound   : pick('sound_level', v => v * 2),
    }
  }, [filteredHistory])

  // ── Excel export ───────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!filteredHistory.length) return

    // Build CSV rows (Excel opens CSV natively)
    const headers = ['Date/Heure', 'Température (°C)', 'Humidité (%)', 'Niveau Sonore (Hz)']
    const rows = filteredHistory.map(d => [
      new Date(d.ts).toLocaleString('fr-FR'),
      d.temperature_c?.toFixed(1) ?? '',
      d.humidity_pct?.toFixed(1)  ?? '',
      d.sound_level != null ? (d.sound_level * 2).toFixed(0) : '',
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(';'))
      .join('\n')

    // Add BOM for Excel to recognise UTF-8 correctly (é, è, etc.)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const date = selectedDate || new Date().toLocaleDateString('en-CA')
    a.href     = url
    a.download = `IBEE_ruche_${hiveId}_${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    isLoading,
    temp, humidity, sound, doorOpen, rssi, battPct, bars, signalLabel,
    metricRanges,
    chartData,
    hasHistory        : filteredHistory.length > 0,
    totalMeasurements : stats?.total_measurements ?? 0,
    // Date filter
    selectedDate,
    setSelectedDate,
    // Excel
    exportExcel,
  }
}