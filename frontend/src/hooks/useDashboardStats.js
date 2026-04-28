import { useQuery }  from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getHiveLatest } from '../api/hives'
import { useHiveList }   from './useHives'

const SOUND_THRESHOLD   = 70
const BATTERY_THRESHOLD = 3.5
const FIFTEEN_MIN       = 15 * 60 * 1000

export function useDashboardStats() {
  const { apiculteurId } = useParams()

  const {
    data: hives = [],
    isLoading: hivesLoading,
    error: hivesError,
  } = useHiveList(apiculteurId)

  const latestQuery = useQuery({
    queryKey       : ['dashboard-latest', apiculteurId, hives.map(h => h.id)],
    queryFn        : async () => {
      if (!hives.length) return []
      const results = await Promise.allSettled(hives.map(h => getHiveLatest(h.id)))
      return results.map((r, i) => ({
        hive_id: hives[i].id,
        data   : r.status === 'fulfilled' ? r.value : null,
      }))
    },
    enabled        : hives.length > 0,
    staleTime      : FIFTEEN_MIN,
    refetchInterval: FIFTEEN_MIN,
  })

  const latestByHive = latestQuery.data ?? []
  const totalHives   = hives.length

  const doorOpenCount = latestByHive.filter(({ data }) => data?.door_open === true).length
  const secureCount   = latestByHive.filter(({ data }) => data !== null && !data?.door_open).length

  const alertHives = latestByHive.filter(({ data }) => {
    if (!data) return false
    return (
      data.door_open === true                            ||
      (data.sound_level   ?? 0)   > SOUND_THRESHOLD     ||
      (data.temperature_c ?? 0)   > 38                  ||
      (data.battery_v     ?? 999) < BATTERY_THRESHOLD
    )
  })

  return {
    isLoading    : hivesLoading || latestQuery.isLoading,
    error        : hivesError   || latestQuery.error,
    totalHives,
    hasUrgent    : alertHives.length > 0,
    alertCount   : alertHives.length,
    secureCount,
    doorOpenCount,
    totalWithData: latestByHive.filter(({ data }) => data !== null).length,
  }
}