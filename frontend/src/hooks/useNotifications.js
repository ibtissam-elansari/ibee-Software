import { useQuery } from '@tanstack/react-query'
import { getNotifications } from '../api/notifications'

export function useNotifications() {
  return useQuery({
    queryKey        : ['notifications'],
    queryFn         : getNotifications,
    refetchInterval : 15_000,   // re-check every 15s
    staleTime       : 10_000,
  })
}