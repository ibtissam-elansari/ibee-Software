import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAlertLog, getDailyAlertCounts, getWeeklyUrgentCounts } from '../api/alertStats'

const todayStr = () => new Date().toLocaleDateString('en-CA')

const RANGE_DAYS = { '7j': 7, '15j': 15, 'Mois': 30 }

export function useAlertStats() {
  const [range,      setRange]      = useState('7j')
  const [startDate,  setStartDate]  = useState('')
  const [endDate,    setEndDate]    = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [impFilter,  setImpFilter]  = useState('')

  // ── Derive API date params ─────────────────────────────────────────────────
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
    return {
      apiStart: start.toISOString(),
      apiEnd  : now.toISOString(),
    }
  }, [range, startDate, endDate])

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
    queryKey    : ['alert-daily', apiStart, apiEnd],
    queryFn     : () => getDailyAlertCounts({ start: apiStart, end: apiEnd }),
    staleTime   : 60_000,
  })

  const weeklyQuery = useQuery({
    queryKey    : ['alert-weekly'],
    queryFn     : getWeeklyUrgentCounts,
    staleTime   : 60_000,
    refetchInterval: 300_000,
  })

  // ── Chart data for timeline ────────────────────────────────────────────────
  const timelineData = useMemo(() =>
    (dailyQuery.data ?? []).map(d => ({
      date  : d.date.slice(5).replace('-', '/'),  // 'MM/DD'
      count : d.count,
    })),
    [dailyQuery.data]
  )

  // ── Week label (e.g. "Fev 10 – Fev 17") ───────────────────────────────────
  const weekLabel = useMemo(() => {
    const now   = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay() + 1)  // Monday
    const end   = new Date(start)
    end.setDate(start.getDate() + 6)
    const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    return `${fmt(start)} – ${fmt(end)}`
  }, [])

  return {
    // Timeline chart
    timelineData,
    timelineLoading : dailyQuery.isLoading,
    range, setRange,
    startDate, setStartDate,
    endDate,   setEndDate,

    // Weekly bar chart
    weeklyData    : weeklyQuery.data ?? [],
    weeklyLoading : weeklyQuery.isLoading,
    weekLabel,

    // Alert log table
    alerts        : logQuery.data ?? [],
    alertsLoading : logQuery.isLoading,
    totalToday    : (logQuery.data ?? []).filter(a => {
      return new Date(a.ts).toLocaleDateString('en-CA') === todayStr()
    }).length,

    // Filters
    typeFilter, setTypeFilter,
    impFilter,  setImpFilter,
  }
}