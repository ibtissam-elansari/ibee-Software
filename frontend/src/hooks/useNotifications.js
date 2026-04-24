// hooks/useNotifications.js
import { useQuery } from '@tanstack/react-query'
import { getNotifications }             from '../api/notifications'
import { getApiculteurNotifications }   from '../api/apiculteurs'

// When apiculteurId is provided → scoped to that coop's hives
// When omitted (superuser global) → all notifications
export function useNotifications(apiculteurId) {
  return useQuery({
    queryKey        : apiculteurId
      ? ['notifications', apiculteurId]
      : ['notifications'],
    queryFn         : apiculteurId
      ? () => getApiculteurNotifications(apiculteurId)
      : () => getNotifications(),
    staleTime       : 15_000,
    refetchInterval : 30_000,
  })
}