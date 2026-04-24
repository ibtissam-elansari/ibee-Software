// hooks/useHives.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getHives, getHive, createHive, updateHive, deleteHive,
  getHiveLatest, getHiveHistory, getHiveStats,
} from '../api/hives'
import { getApiculteurHives } from '../api/apiculteurs'

// ── Hive list ─────────────────────────────────────────────────────────────────
// When apiculteurId is provided, fetch scoped hives via the apiculteur endpoint.
// When omitted (superuser global context), fetch all hives.
export function useHiveList(apiculteurId) {
  return useQuery({
    queryKey : apiculteurId ? ['apiculteur-hives', apiculteurId] : ['hives'],
    queryFn  : apiculteurId
      ? () => getApiculteurHives(apiculteurId)
      : () => getHives(),
    enabled  : true,
    staleTime: 15_000,
    refetchInterval: 60_000,
  })
}

export function useHive(id) {
  return useQuery({
    queryKey : ['hive', id],
    queryFn  : () => getHive(id),
    enabled  : !!id,
    staleTime: 30_000,
  })
}

// ── Hive data ─────────────────────────────────────────────────────────────────
export function useHiveLatest(hiveId, options = {}) {
  const { enabled: enabledOpt, ...rest } = options
  return useQuery({
    queryKey        : ['hive-latest', hiveId],
    queryFn         : () => getHiveLatest(hiveId),
    enabled         : !!hiveId && (enabledOpt !== false),  // respects caller's override
    staleTime       : 5_000,
    refetchInterval : 15_000,
    ...rest,
  })
}

export function useHiveHistory(hiveId, limit, start, end) {
  return useQuery({
    queryKey : ['hive-history', hiveId, limit, start, end],
    queryFn  : () => getHiveHistory(hiveId, limit, start, end),
    enabled  : !!hiveId,
    staleTime: 30_000,
  })
}

export function useHiveStats(hiveId) {
  return useQuery({
    queryKey : ['hive-stats', hiveId],
    queryFn  : () => getHiveStats(hiveId),
    enabled  : !!hiveId,
    staleTime: 60_000,
  })
}

// ── Mutations ──────────────────────────────────────────────────────────────────
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