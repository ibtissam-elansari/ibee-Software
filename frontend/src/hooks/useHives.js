// /hooks/useHives.js
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import * as hivesApi from '../api/hives';
import useHiveStore from '../store/useHiveStore';
import { useEffect } from 'react';

// ── Query keys — single source of truth for cache invalidation ───────────────
export const hiveKeys = {
  all     : ['hives'],
  detail  : (id) => ['hives', id],
  latest  : (id) => ['hives', id, 'latest'],
  history : (id) => ['hives', id, 'history'],
  stats   : (id) => ['hives', id, 'stats'],
};

// ── Fetch all hives + sync into Zustand ──────────────────────────────────────
export function useHiveList() {
  const setHives = useHiveStore(s => s.setHives);

  const query = useQuery({
    queryKey : hiveKeys.all,
    queryFn  : hivesApi.getHives,
  });

  // Keep Zustand in sync whenever react-query fetches fresh data
  useEffect(() => {
    if (query.data) setHives(query.data);
  }, [query.data, setHives]);

  return query;
}

export function useAllHivesLatest(hiveIds = []) {
  return useQueries({
    queries: hiveIds.map(id => ({
      queryKey: ['hive-latest', id],
      queryFn: () => api.get(`/api/hives/${id}/latest`).then(r => r.data),
      refetchInterval: 15_000,
      staleTime: 10_000,
    })),
  });
}

// ── Latest measurement for one hive (polling every 15s) ──────────────────────
export function useHiveLatest(hiveId) {
  return useQuery({
    queryKey  : hiveKeys.latest(hiveId),
    queryFn   : () => hivesApi.getHiveLatest(hiveId),
    enabled   : !!hiveId,
    refetchInterval: 15_000,   // poll every 15s (SSE not used in this app)
    staleTime : 10_000,
  });
}

// ── History for charts ────────────────────────────────────────────────────────
export function useHiveHistory(hiveId, limit = 100) {
  return useQuery({
    queryKey       : hiveKeys.history(hiveId),
    queryFn        : () => hivesApi.getHiveHistory(hiveId, limit),
    enabled        : !!hiveId,
    refetchInterval: 15_000,  // same cadence as latest
    staleTime      : 10_000,
  });
}

// ── Aggregate stats ───────────────────────────────────────────────────────────
export function useHiveStats(hiveId) {
  return useQuery({
    queryKey : hiveKeys.stats(hiveId),
    queryFn  : () => hivesApi.getHiveStats(hiveId),
    enabled  : !!hiveId,
    staleTime: 60_000,
  });
}

// ── Create hive ───────────────────────────────────────────────────────────────
export function useCreateHive() {
  const queryClient = useQueryClient();
  const addHive     = useHiveStore(s => s.addHive);

  return useMutation({
    mutationFn: hivesApi.createHive,
    onSuccess : (newHive) => {
      addHive(newHive);
      queryClient.invalidateQueries({ queryKey: hiveKeys.all });
    },
  });
}

// ── Update hive ───────────────────────────────────────────────────────────────
export function useUpdateHive() {
  const queryClient = useQueryClient();
  const updateHive  = useHiveStore(s => s.updateHive);

  return useMutation({
    mutationFn: ({ id, data }) => hivesApi.updateHive(id, data),
    onSuccess : (updated) => {
      updateHive(updated.id, updated);
      queryClient.invalidateQueries({ queryKey: hiveKeys.all });
    },
  });
}

// ── Delete hive ───────────────────────────────────────────────────────────────
export function useDeleteHive() {
  const queryClient = useQueryClient();
  const removeHive  = useHiveStore(s => s.removeHive);

  return useMutation({
    mutationFn: hivesApi.deleteHive,
    onSuccess : (_, id) => {
      removeHive(id);
      queryClient.invalidateQueries({ queryKey: hiveKeys.all });
    },
  });
}