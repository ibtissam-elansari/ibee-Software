import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getHiveHistory } from '../../../api/hives'
import { METRIC_CONFIG } from '../config/metricConfig'

const todayStr = () => new Date().toLocaleDateString('en-CA')

export function useMetricDetail(hiveId, metric) {
  const [range,     setRange]     = useState('J')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  const cfg   = METRIC_CONFIG[metric] ?? METRIC_CONFIG.temperature
  const field = { temperature: 'temperature_c', humidity: 'humidity_pct', sound: 'sound_level' }[metric]
  const unit  = cfg.unit
  const scale = cfg.scale

  // ── Build API params from range or custom date range ──────────────────────
  const { apiStart, apiEnd, limit } = useMemo(() => {
    // Custom date range takes priority
    if (startDate || endDate) {
      return {
        apiStart : startDate ? new Date(startDate + 'T00:00:00').toISOString() : undefined,
        apiEnd   : endDate   ? new Date(endDate   + 'T23:59:59').toISOString() : undefined,
        limit    : 5000,
      }
    }
    const now   = new Date()
    const today = new Date(todayStr() + 'T00:00:00')

    if (range === 'J') {
      return {
        apiStart : today.toISOString(),
        apiEnd   : new Date(todayStr() + 'T23:59:59').toISOString(),
        limit    : 2000,
      }
    }
    if (range === '7j') {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return { apiStart: d.toISOString(), apiEnd: undefined, limit: 5000 }
    }
    // Mois
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    return { apiStart: d.toISOString(), apiEnd: undefined, limit: 10000 }
  }, [range, startDate, endDate])

  const { data: history, isLoading } = useQuery({
    queryKey    : ['hives', hiveId, 'metric-detail', metric, range, startDate, endDate],
    queryFn     : () => getHiveHistory(hiveId, limit, apiStart, apiEnd),
    enabled     : !!hiveId,
    staleTime   : 30_000,
  })

  // ── Extract + scale values ─────────────────────────────────────────────────
  const values = useMemo(() =>
    (history ?? [])
      .filter(d => d[field] != null)
      .map(d => ({ raw: d[field], scaled: scale(d[field]), ts: d.ts })),
    [history, field, scale]
  )

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const scaledVals = values.map(v => v.scaled)
  const avg    = scaledVals.length ? scaledVals.reduce((a,b) => a+b,0) / scaledVals.length : null
  const max    = scaledVals.length ? Math.max(...scaledVals) : null
  const min    = scaledVals.length ? Math.min(...scaledVals) : null
  const alerts = values.filter(v => v.raw >= cfg.alertThreshold).length

  // ── Chart data + smart X ticks ─────────────────────────────────────────────
  const chartData = useMemo(() =>
    values.map(v => {
      const dt = new Date(v.ts)
      // For day view: show HH:mm, for week/month: show DD/MM
      const isDay  = range === 'J' && !startDate && !endDate
      const label  = isDay
        ? `${String(dt.getHours()).padStart(2,'0')}h${String(dt.getMinutes()).padStart(2,'0')}`
        : `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`
      return {
        time   : label,
        tooltip: new Date(v.ts).toLocaleString('fr-FR'),
        value  : +v.scaled.toFixed(1),
      }
    }),
    [values, range, startDate, endDate]
  )

  const xAxisTicks = useMemo(() => {
    if (chartData.length < 2) return undefined
    const total = chartData.length
    const step  = Math.max(1, Math.round(total / 8))
    return chartData
      .filter((_, i) => i % step === 0 || i === total - 1)
      .map(d => d.time)
  }, [chartData])

  // ── Excel export ────────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!values.length) return
    const headers = ['Date/Heure', `${cfg.fullLabel} (${unit})`]
    const rows = values.map(v => [
      new Date(v.ts).toLocaleString('fr-FR'),
      v.scaled.toFixed(1),
    ])
    const csv  = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `IBEE_${metric}_${hiveId}_${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    isLoading,
    unit,
    range, setRange,
    startDate, setStartDate,
    endDate,   setEndDate,
    avg  : avg  != null ? +avg.toFixed(1)  : null,
    max  : max  != null ? +max.toFixed(1)  : null,
    min  : min  != null ? +min.toFixed(1)  : null,
    alerts,
    chartData,
    xAxisTicks,
    hasData: chartData.length > 0,
    exportExcel,
  }
}