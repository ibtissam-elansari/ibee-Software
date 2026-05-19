// hooks/useAlertStats.js
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getAlertLog,
  getDailyAlertCounts,
  getWeeklyUrgentCounts,
  getSensorTimeline,
} from '../api/alertStats'

// ── Constants ──────────────────────────────────────────────────────────────────

const FIFTEEN_MIN = 15 * 60 * 1000
const todayStr    = () => new Date().toLocaleDateString('en-CA')
const RANGE_DAYS  = { '7j': 7, '15j': 15, 'Mois': 30 }

export const ALERT_TYPES = ['security', 'temperature', 'humidity', 'battery', 'sound']

export const TYPE_COLORS = {
  security   : '#2563EB',
  temperature: '#EF4444',
  humidity   : '#3B82F6',
  battery    : '#D97706',
  sound      : '#16A34A',
}

export const TYPE_LABELS = {
  security   : 'Sécurité',
  temperature: 'Température',
  humidity   : 'Humidité',
  battery    : 'Batterie',
  sound      : 'Sonore',
}

/** Threshold bands for each continuous sensor, used by chart components. */
export const SENSOR_THRESHOLDS = {
  temperature: { attention: 35, urgent: 38,  unit: '°C', min: 15, max: 45 },
  humidity   : { attention: 70, urgent: 80,  unit: '%',  min: 30, max: 95 },
  battery    : { low: 3.6,                   unit: 'V',  min: 3.0, max: 4.2 },
  sound      : { attention: 70, urgent: 85,  unit: 'dB', min: 0,  max: 110 },
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAlertStats(apiculteurId) {
  // Date range controls
  const [range,     setRange]     = useState('7j')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  // Hive filter
  const [selectedHiveId, setSelectedHiveId] = useState(null)

  // Alert log filters
  const [typeFilter, setTypeFilter] = useState('')
  const [impFilter,  setImpFilter]  = useState('')

  // ── Build API date range ─────────────────────────────────────────────────────
  const { apiStart, apiEnd } = useMemo(() => {
    if (startDate || endDate) {
      return {
        apiStart: startDate ? startDate + 'T00:00:00Z' : undefined,
        apiEnd  : endDate   ? endDate   + 'T23:59:59Z' : undefined,
      }
    }
    const now   = new Date()
    const days  = RANGE_DAYS[range] ?? 7
    const start = new Date(now)
    start.setDate(start.getDate() - days)
    return { apiStart: start.toISOString(), apiEnd: now.toISOString() }
  }, [range, startDate, endDate])

  // Shared scope params
  const scopeParams = useMemo(() => ({
    apiculteur_id: apiculteurId   || undefined,
    hive_id      : selectedHiveId || undefined,
  }), [apiculteurId, selectedHiveId])

  const rangeParams = useMemo(() => ({
    ...scopeParams,
    start: apiStart,
    end  : apiEnd,
  }), [scopeParams, apiStart, apiEnd])

  // ── Alert log ────────────────────────────────────────────────────────────────
  const logQuery = useQuery({
    queryKey: ['alert-log', apiculteurId, selectedHiveId, apiStart, apiEnd, typeFilter, impFilter],
    queryFn : () => getAlertLog({
      ...rangeParams,
      type      : typeFilter || undefined,
      importance: impFilter  || undefined,
    }),
    staleTime      : FIFTEEN_MIN,
    refetchInterval: FIFTEEN_MIN,
  })

  // ── Daily totals (for volume timeline) ──────────────────────────────────────
  const dailyQuery = useQuery({
    queryKey : ['alert-daily', apiculteurId, selectedHiveId, apiStart, apiEnd],
    queryFn  : () => getDailyAlertCounts(rangeParams),
    staleTime: FIFTEEN_MIN,
  })

  // ── Per-sensor timelines ─────────────────────────────────────────────────────
  const makeSensorQuery = (type) => ({
    queryKey: ['sensor-timeline', type, apiculteurId, selectedHiveId, apiStart, apiEnd],
    queryFn : () => getSensorTimeline(type, rangeParams),
    staleTime: FIFTEEN_MIN,
  })

  const tempQuery     = useQuery(makeSensorQuery('temperature'))
  const humQuery      = useQuery(makeSensorQuery('humidity'))
  const batteryQuery  = useQuery(makeSensorQuery('battery'))
  const soundQuery    = useQuery(makeSensorQuery('sound'))
  const securityQuery = useQuery(makeSensorQuery('security'))

  // ── KPIs derived from log data ───────────────────────────────────────────────
  const kpis = useMemo(() => {
    const alerts = logQuery.data ?? []
    const today  = todayStr()

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString('en-CA')

    const lastWeekStart = new Date()
    lastWeekStart.setDate(lastWeekStart.getDate() - 14)
    const lastWeekEnd = new Date()
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

    const totalToday      = alerts.filter(a => new Date(a.ts).toLocaleDateString('en-CA') === today).length
    const totalYesterday  = alerts.filter(a => new Date(a.ts).toLocaleDateString('en-CA') === yesterdayStr).length
    const totalPeriod     = alerts.length
    const urgentPeriod    = alerts.filter(a => a.importance === 'urgente').length

    // Hive with most alerts
    const hiveCount = {}
    alerts.forEach(a => { hiveCount[a.hive_name] = (hiveCount[a.hive_name] ?? 0) + 1 })
    const topHive = Object.entries(hiveCount).sort((a, b) => b[1] - a[1])[0]

    // Per-hive breakdown for bar chart
    const hiveBreakdown = Object.entries(hiveCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Per-type breakdown
    const typeCount = {}
    alerts.forEach(a => { typeCount[a.type] = (typeCount[a.type] ?? 0) + 1 })
    const typeBreakdown = ALERT_TYPES.map(t => ({ type: t, count: typeCount[t] ?? 0 }))

    return {
      totalToday,
      deltaToday  : totalToday - totalYesterday,
      totalPeriod,
      urgentPeriod,
      urgentPct   : totalPeriod > 0 ? Math.round((urgentPeriod / totalPeriod) * 100) : 0,
      topHiveName : topHive?.[0] ?? '—',
      topHiveCount: topHive?.[1] ?? 0,
      hiveBreakdown,
      typeBreakdown,
    }
  }, [logQuery.data])

  // ── Timeline data (volume, stacked by importance) ────────────────────────────
  const timelineData = useMemo(() => {
    const raw     = dailyQuery.data ?? []
    const alerts  = logQuery.data   ?? []

    // Build urgente / attention counts per date from log
    const byDate = {}
    alerts.forEach(a => {
      const day = new Date(a.ts).toLocaleDateString('en-CA')
      if (!byDate[day]) byDate[day] = { urgente: 0, attention: 0 }
      byDate[day][a.importance] = (byDate[day][a.importance] ?? 0) + 1
    })

    return raw.map(d => ({
      date     : d.date.slice(5).replace('-', '/'),
      total    : d.count,
      urgente  : byDate[d.date]?.urgente   ?? 0,
      attention: byDate[d.date]?.attention ?? 0,
    }))
  }, [dailyQuery.data, logQuery.data])

  // ── Format sensor timelines for chart consumption ────────────────────────────
  const formatSensorData = (queryData) =>
    (queryData ?? []).map(d => ({
      date : d.date.slice(5).replace('-', '/'),
      min  : d.min,
      max  : d.max,
      avg  : d.avg,
      count: d.count,
    }))

  return {
    // Controls
    range, setRange,
    startDate, setStartDate,
    endDate,   setEndDate,
    selectedHiveId, setSelectedHiveId,
    typeFilter, setTypeFilter,
    impFilter,  setImpFilter,

    // KPIs
    kpis,

    // Volume timeline
    timelineData,
    timelineLoading: dailyQuery.isLoading,

    // Per-sensor timelines
    sensorData: {
      temperature: formatSensorData(tempQuery.data),
      humidity   : formatSensorData(humQuery.data),
      battery    : formatSensorData(batteryQuery.data),
      sound      : formatSensorData(soundQuery.data),
      security   : formatSensorData(securityQuery.data),
    },
    sensorLoading: {
      temperature: tempQuery.isLoading,
      humidity   : humQuery.isLoading,
      battery    : batteryQuery.isLoading,
      sound      : soundQuery.isLoading,
      security   : securityQuery.isLoading,
    },

    // Alert log
    alerts       : logQuery.data ?? [],
    alertsLoading: logQuery.isLoading,
  }
}