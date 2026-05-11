import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useHives, useHiveLatest } from './useHives'
import { getHiveEffectiveThresholds } from '../api/hives'
import { measurementAlertStatus } from './useHiveThresholds'

const FIFTEEN_MIN = 15 * 60 * 1000

// One hook per hive — fetches latest + effective thresholds
function useHiveSummary(hive) {
  const { data: latest }     = useHiveLatest(hive.id)
  const { data: thresholds } = useQuery({
    queryKey  : ['hive-thresholds', hive.id],
    queryFn   : () => getHiveEffectiveThresholds(hive.id),
    staleTime : FIFTEEN_MIN,
    enabled   : !!hive.id,
  })
  return { latest, thresholds }
}

// Internal component-like hook: accepts pre-fetched latest + thresholds
function alertStatusFor(latest, thresholds) {
  if (!latest || !thresholds) return 'normal'
  return measurementAlertStatus(latest, thresholds)
}

export function useDashboardStats() {
  const { data: hives = [], isLoading, isError } = useHives()

  // Fetch latest + thresholds for every hive in parallel
  // (React Query deduplicates — these are already cached by HiveRow/HiveCard)
  const summaries = hives.map(h => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useHiveSummary(h)
  })

  const stats = useMemo(() => {
    const totalHives    = hives.length
    const totalWithData = summaries.filter(s => s.latest).length
    const openHivesList = []
    let alertCount      = 0
    let secureCount     = 0

    hives.forEach((hive, i) => {
      const { latest, thresholds } = summaries[i]
      if (!latest) return

      const status = alertStatusFor(latest, thresholds)
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
  }, [hives, summaries])

  return { isLoading, isError, ...stats }
}