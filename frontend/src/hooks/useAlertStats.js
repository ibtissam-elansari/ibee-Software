import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAlertLog, getDailyAlertCounts, getWeeklyUrgentCounts } from '../api/alertStats'

const todayStr = () => new Date().toLocaleDateString('en-CA')

const RANGE_DAYS = { '7j': 7, '15j': 15, 'Mois': 30 }
const WEEKLY_RANGE_DAYS = { '7j': 7, '15j': 15, 'Mois': 30 }

export function useAlertStats() {
  // ── Single shared date range ───────────────────────────────────────────────
  const [range,      setRange]      = useState('7j')
  const [startDate,  setStartDate]  = useState('')
  const [endDate,    setEndDate]    = useState('')
  const [weeklyRange, setWeeklyRange] = useState('7j')

  // ── Filters ───────────────────────────────────────────────────────────────
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

  // ── Queries ────────────────────────────────────────────────────────────────
  const logQuery = useQuery({
    queryKey    : ['alert-log', apiStart, apiEnd, typeFilter, impFilter],
    queryFn     : () => getAlertLog({
      start     : apiStart,
      end       : apiEnd,
      type      : typeFilter || undefined,
      importance: impFilter  || undefined,
    }),
    staleTime   : 30_000,
    refetchInterval: 60_000,
  })

  const dailyQuery = useQuery({
    queryKey : ['alert-daily', apiStart, apiEnd],
    queryFn  : () => getDailyAlertCounts({ start: apiStart, end: apiEnd }),
    staleTime: 60_000,
  })

  const weeklyQuery = useQuery({
    queryKey : ['alert-weekly', weeklyApiStart, weeklyApiEnd],
    queryFn  : () => getWeeklyUrgentCounts(weeklyApiStart, weeklyApiEnd),
    staleTime: 60_000,
    refetchInterval: 300_000,
  })

  const timelineData = useMemo(() =>
    (dailyQuery.data ?? []).map(d => ({
      date : d.date.slice(5).replace('-', '/'),
      count: d.count,
    })),
    [dailyQuery.data]
  )

  return {
    // Shared date range
    range, setRange,
    startDate, setStartDate,
    endDate,   setEndDate,

    // Timeline
    timelineData,
    timelineLoading: dailyQuery.isLoading,

    // Weekly
    weeklyRange, setWeeklyRange,
    weeklyData   : weeklyQuery.data ?? [],
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