import { useQuery } from '@tanstack/react-query'
import { getNotifications }           from '../api/notifications'
import { getApiculteurNotifications } from '../api/apiculteurs'

const FIFTEEN_MIN = 15 * 60 * 1000

export function useNotifications(apiculteurId) {
  return useQuery({
    queryKey       : apiculteurId ? ['notifications', apiculteurId] : ['notifications'],
    queryFn        : apiculteurId
      ? () => getApiculteurNotifications(apiculteurId)
      : () => getNotifications(),
    staleTime      : FIFTEEN_MIN,
    refetchInterval: FIFTEEN_MIN,
  })
}