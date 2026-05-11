import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useHives }   from './useHives'
import { getHiveLatest, getHiveEffectiveThresholds } from '../api/hives'
import { measurementAlertStatus } from './useHiveThresholds'

const FIFTEEN_MIN = 15 * 60 * 1000

export function useDashboardStats() {
  const { data: hives = [], isLoading, isError } = useHives()

  // ── Fetch latest measurement for every hive in parallel ───────────────────
  const latestResults = useQueries({
    queries: hives.map(h => ({
      queryKey       : ['hive-latest', h.id],
      queryFn        : () => getHiveLatest(h.id),
      staleTime      : FIFTEEN_MIN,
      refetchInterval: FIFTEEN_MIN,
      enabled        : !!h.id,
    })),
  })

  // ── Fetch effective thresholds for every hive in parallel ─────────────────
  const thresholdResults = useQueries({
    queries: hives.map(h => ({
      queryKey : ['hive-thresholds', h.id],
      queryFn  : () => getHiveEffectiveThresholds(h.id),
      staleTime: FIFTEEN_MIN,
      enabled  : !!h.id,
    })),
  })

  // ── Compute stats once all data is available ───────────────────────────────
  const stats = useMemo(() => {
    const totalHives    = hives.length
    const openHivesList = []
    let alertCount  = 0
    let secureCount = 0
    let totalWithData = 0

    hives.forEach((hive, i) => {
      const latest     = latestResults[i]?.data
      const thresholds = thresholdResults[i]?.data

      if (!latest) return
      totalWithData++

      const status = measurementAlertStatus(latest, thresholds)
      if (status === 'urgente' || status === 'attention') alertCount++

      if (!latest.door_open) {
        secureCount++
      } else {
        openHivesList.push(hive)
      }
    })

    return {
      totalHives,
      totalWithData,
      alertCount,
      secureCount,
      doorOpenCount: openHivesList.length,
      openHives    : openHivesList,
      hasUrgent    : alertCount > 0,
    }
  }, [hives, latestResults, thresholdResults])

  return { isLoading, isError, ...stats }
}