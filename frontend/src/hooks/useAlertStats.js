// hooks/useAlertStats.js

import { useState, useMemo } from 'react'
import { useQuery }          from '@tanstack/react-query'
import { getAlertLog, getDailyAlertCounts, getWeeklyUrgentCounts } from '../api/alertStats'

const todayStr = () => new Date().toLocaleDateString('en-CA')
const RANGE_DAYS = { '7j': 7, '15j': 15, 'Mois': 30 }

export const ALERT_TYPES = ['security', 'temperature', 'humidity', 'battery', 'sound']

export const TYPE_COLORS = {
  security   : '#2563EB',
  temperature: '#EF4444',
  humidity   : '#60A5FA',
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
  const [range,       setRange]       = useState('7j')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [weeklyRange, setWeeklyRange] = useState('7j')
  const [typeFilter,  setTypeFilter]  = useState('')
  const [impFilter,   setImpFilter]   = useState('')

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

  const { weeklyApiStart, weeklyApiEnd, weekLabel } = useMemo(() => {
    const now   = new Date()
    const days  = RANGE_DAYS[weeklyRange] ?? 7
    const start = new Date(now)
    start.setDate(start.getDate() - days)
    const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    return {
      weeklyApiStart: start.toISOString(),
      weeklyApiEnd  : now.toISOString(),
      weekLabel     : `${fmt(start)} – ${fmt(now)}`,
    }
  }, [weeklyRange])

  // ── Fetch ALL alerts (no type filter) — used to compute breakdowns ─────────
  const allAlertsQuery = useQuery({
    queryKey : ['alert-log-all', apiStart, apiEnd, apiculteurId],
    queryFn  : () => getAlertLog({ start: apiStart, end: apiEnd, apiculteur_id: apiculteurId, limit: 2000 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled  : !!apiculteurId,
  })

  // ── Filtered log — for the right-column list ───────────────────────────────
  const logQuery = useQuery({
    queryKey : ['alert-log', apiStart, apiEnd, typeFilter, impFilter, apiculteurId],
    queryFn  : () => getAlertLog({
      start: apiStart, end: apiEnd,
      type: typeFilter || undefined, importance: impFilter || undefined,
      apiculteur_id: apiculteurId,
    }),
    staleTime: 30_000, refetchInterval: 60_000, enabled: !!apiculteurId,
  })

  const dailyQuery = useQuery({
    queryKey : ['alert-daily', apiStart, apiEnd, apiculteurId],
    queryFn  : () => getDailyAlertCounts({ start: apiStart, end: apiEnd, apiculteur_id: apiculteurId }),
    staleTime: 60_000, enabled: !!apiculteurId,
  })

  // ── Timeline data: total count + per-type breakdown ────────────────────────
  const typeBreakdownByDate = useMemo(() => {
    const map = {}
    ;(allAlertsQuery.data ?? []).forEach(alert => {
      const day = new Date(alert.ts).toLocaleDateString('en-CA')
      if (!map[day]) map[day] = {}
      map[day][alert.type] = (map[day][alert.type] ?? 0) + 1
    })
    return map
  }, [allAlertsQuery.data])

  const timelineData = useMemo(() =>
    (dailyQuery.data ?? []).map(d => {
      const breakdown = typeBreakdownByDate[d.date] ?? {}
      const total     = d.count
      return {
        date       : d.date.slice(5).replace('-', '/'),
        count      : total,
        breakdown,
        // Percentages: "Humidité: 30%" shown in tooltip
        percentages: Object.fromEntries(
          ALERT_TYPES.map(t => [t, total > 0 ? Math.round(((breakdown[t] ?? 0) / total) * 100) : 0])
        ),
      }
    }),
    [dailyQuery.data, typeBreakdownByDate]
  )

  // ── Weekly stacked data: per-type counts per weekday ──────────────────────
  const weeklyStackedData = useMemo(() => {
    const DAY_LABELS = ['L', 'M', 'Mer', 'J', 'V', 'S', 'D']
    const map = Object.fromEntries(DAY_LABELS.map((_, i) => [i, {}]))

    const weeklyStart = new Date(weeklyApiStart)
    ;(allAlertsQuery.data ?? []).forEach(alert => {
      if (new Date(alert.ts) < weeklyStart) return
      const wd = (new Date(alert.ts).getDay() + 6) % 7  // Mon=0
      map[wd][alert.type] = (map[wd][alert.type] ?? 0) + 1
    })

    return DAY_LABELS.map((label, i) => ({
      day: label,
      ...Object.fromEntries(ALERT_TYPES.map(t => [t, map[i][t] ?? 0])),
    }))
  }, [allAlertsQuery.data, weeklyApiStart])

  return {
    range, setRange, startDate, setStartDate, endDate, setEndDate,
    timelineData,
    timelineLoading: dailyQuery.isLoading || allAlertsQuery.isLoading,
    weeklyRange, setWeeklyRange,
    weeklyData: weeklyStackedData,
    weeklyLoading: allAlertsQuery.isLoading,
    weekLabel,
    alerts       : logQuery.data ?? [],
    alertsLoading: logQuery.isLoading,
    totalToday   : (logQuery.data ?? []).filter(a =>
      new Date(a.ts).toLocaleDateString('en-CA') === todayStr()
    ).length,
    typeFilter, setTypeFilter, impFilter, setImpFilter,
  }
}