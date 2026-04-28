// frontend/src/hooks/userAlertStats

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAlertLog, getDailyAlertCounts, getWeeklyUrgentCounts } from '../api/alertStats'

const todayStr = () => new Date().toLocaleDateString('en-CA')

const RANGE_DAYS        = { '7j': 7, '15j': 15, 'Mois': 30 }
const WEEKLY_RANGE_DAYS = { '7j': 7, '15j': 15, 'Mois': 30 }

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

export function useAlertStats(apiculteurId) {
  // ── Date range ─────────────────────────────────────────────────────────────
  const [range,       setRange]       = useState('7j')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [weeklyRange, setWeeklyRange] = useState('7j')

  // ── Hive filter ────────────────────────────────────────────────────────────
  const [selectedHiveId, setSelectedHiveId] = useState(null)

  // ── Alert type / importance filters ───────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState('')
  const [impFilter,  setImpFilter]  = useState('')

  // ── Build shared API dates ─────────────────────────────────────────────────
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

  // ── Weekly range API dates ─────────────────────────────────────────────────
  const { weeklyApiStart, weeklyApiEnd, weekLabel } = useMemo(() => {
    const now   = new Date()
    const days  = WEEKLY_RANGE_DAYS[weeklyRange] ?? 7
    const start = new Date(now)
    start.setDate(start.getDate() - days)
    const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    return {
      weeklyApiStart : start.toISOString(),
      weeklyApiEnd   : now.toISOString(),
      weekLabel      : `${fmt(start)} – ${fmt(now)}`,
    }
  }, [weeklyRange])

  // ── Shared scope params passed to every query ──────────────────────────────
  const scopeParams = {
    apiculteur_id: apiculteurId   || undefined,
    hive_id      : selectedHiveId || undefined,
  }


  // ── Alert log ──────────────────────────────────────────────────────────────

  const FIFTEEN_MIN = 15 * 60 * 1000
  const FIVE_MIN    = 5 * 60 * 1000

  // Alert log
  const logQuery = useQuery({
    queryKey       : ['alert-log', apiculteurId, selectedHiveId, apiStart, apiEnd, typeFilter, impFilter],
    queryFn     : () => getAlertLog({
      ...scopeParams,
      start     : apiStart,
      end       : apiEnd,
      type      : typeFilter || undefined,
      importance: impFilter  || undefined,
    }),
    staleTime      : FIFTEEN_MIN,
    refetchInterval: FIFTEEN_MIN,
  })

  // Daily timeline — historical aggregation, no need to auto-refetch
  const dailyQuery = useQuery({
    queryKey : ['alert-daily', apiculteurId, selectedHiveId, apiStart, apiEnd],
    queryFn  : () => getDailyAlertCounts({ ...scopeParams, start: apiStart, end: apiEnd }),
    staleTime: FIFTEEN_MIN,
    // refetchInterval omitted — data doesn't change until the next uplink
  })

  // Weekly — slightly fresher since it covers an active window
  const weeklyQuery = useQuery({
    queryKey       : ['alert-weekly', apiculteurId, selectedHiveId, weeklyApiStart, weeklyApiEnd],
    queryFn        : () => getWeeklyUrgentCounts(weeklyApiStart, weeklyApiEnd, apiculteurId, selectedHiveId),
    staleTime      : FIFTEEN_MIN,
    refetchInterval: FIFTEEN_MIN,
  })

  // ── Timeline data with per-type breakdown ──────────────────────────────────
  const timelineData = useMemo(() => {
    const raw       = dailyQuery.data ?? []
    const logAlerts = logQuery.data   ?? []

    const byDate = {}
    logAlerts.forEach(alert => {
      const day = new Date(alert.ts).toLocaleDateString('en-CA')
      if (!byDate[day]) byDate[day] = {}
      byDate[day][alert.type] = (byDate[day][alert.type] ?? 0) + 1
    })

    return raw.map(d => {
      const breakdown   = byDate[d.date] ?? {}
      const total       = d.count
      const percentages = Object.fromEntries(
        ALERT_TYPES.map(t => [
          t,
          total > 0 ? Math.round(((breakdown[t] ?? 0) / total) * 100) : 0,
        ])
      )
      return {
        date: d.date.slice(5).replace('-', '/'),
        count: d.count,
        breakdown,
        percentages,
      }
    })
  }, [dailyQuery.data, logQuery.data])

  // ── Weekly stacked bar data ────────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    const base      = weeklyQuery.data ?? []
    const logAlerts = logQuery.data    ?? []

    const byDay = {}
    logAlerts.forEach(alert => {
      if (alert.importance !== 'urgente') return
      const dt  = new Date(alert.ts)
      const day = ['D', 'L', 'M', 'Mer', 'J', 'V', 'S'][dt.getDay()]
      if (!byDay[day]) byDay[day] = {}
      byDay[day][alert.type] = (byDay[day][alert.type] ?? 0) + 1
    })

    return base.map(({ day, count }) => ({
      day,
      count,
      ...Object.fromEntries(ALERT_TYPES.map(t => [t, byDay[day]?.[t] ?? 0])),
    }))
  }, [weeklyQuery.data, logQuery.data])

  return {
    // Date range
    range, setRange,
    startDate, setStartDate,
    endDate,   setEndDate,

    // Hive filter
    selectedHiveId, setSelectedHiveId,

    // Timeline
    timelineData,
    timelineLoading: dailyQuery.isLoading,

    // Weekly
    weeklyRange, setWeeklyRange,
    weeklyData,
    weeklyLoading: weeklyQuery.isLoading,
    weekLabel,

    // Alert log
    alerts       : logQuery.data ?? [],
    alertsLoading: logQuery.isLoading,
    totalToday   : (logQuery.data ?? []).filter(a =>
      new Date(a.ts).toLocaleDateString('en-CA') === todayStr()
    ).length,

    // Filters
    typeFilter, setTypeFilter,
    impFilter,  setImpFilter,
  }
}