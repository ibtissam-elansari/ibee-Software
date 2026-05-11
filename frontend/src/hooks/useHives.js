import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getHives, getHive, createHive, updateHive, deleteHive,
  getHiveLatest, getHiveHistory, getHiveStats,
} from '../api/hives'
import { getApiculteurHives } from '../api/apiculteurs'

const FIFTEEN_MIN = 15 * 60 * 1000   // data cadence — never poll faster than this

export function useHiveList(apiculteurId) {
  return useQuery({
    queryKey       : apiculteurId ? ['apiculteur-hives', apiculteurId] : ['hives'],
    queryFn        : apiculteurId ? () => getApiculteurHives(apiculteurId) : () => getHives(),
    staleTime      : FIFTEEN_MIN,
    refetchInterval: FIFTEEN_MIN,
  })
}

export function useHive(id) {
  return useQuery({
    queryKey : ['hive', id],
    queryFn  : () => getHive(id),
    enabled  : !!id,
    staleTime: FIFTEEN_MIN,
    // No auto-refetch — hive metadata changes only when a superuser edits it
  })
}

export function useHiveLatest(hiveId, options = {}) {
  const { enabled: enabledOpt, ...rest } = options
  return useQuery({
    queryKey       : ['hive-latest', hiveId],
    queryFn        : () => getHiveLatest(hiveId),
    enabled        : !!hiveId && (enabledOpt !== false),
    // Data is 15-min cadence. Keep it fresh for that window; re-fetch once per cycle.
    staleTime      : FIFTEEN_MIN,
    refetchInterval: FIFTEEN_MIN,
    ...rest,
  })
}

export function useHiveHistory(hiveId, limit, start, end) {
  return useQuery({
    queryKey : ['hive-history', hiveId, limit, start, end],
    queryFn  : () => getHiveHistory(hiveId, limit, start, end),
    enabled  : !!hiveId,
    staleTime: FIFTEEN_MIN,
    // No auto-refetch — history for a past window never changes.
    // History for "today" is refetched when the query key changes (selectedDate).
  })
}

export function useHiveStats(hiveId) {
  return useQuery({
    queryKey       : ['hive-stats', hiveId],
    queryFn        : () => getHiveStats(hiveId),
    enabled        : !!hiveId,
    staleTime      : FIFTEEN_MIN,
    refetchInterval: FIFTEEN_MIN,
  })
}

export function useCreateHive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createHive,
    onSuccess : () => qc.invalidateQueries({ queryKey: ['hives'] }),
  })
}

export function useUpdateHive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateHive(id, data),
    onSuccess : () => qc.invalidateQueries({ queryKey: ['hives'] }),
  })
}

export function useDeleteHive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteHive,
    onSuccess : () => qc.invalidateQueries({ queryKey: ['hives'] }),
  })
}

export const useHives = useHiveList