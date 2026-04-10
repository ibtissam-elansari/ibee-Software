import { useQuery } from '@tanstack/react-query';
import { getHives, getHiveLatest } from '../api/hives';

// Thresholds — adjust to match your domain
const SOUND_ALERT_THRESHOLD   = 70;
const BATTERY_ALERT_THRESHOLD = 3.5;

export function useDashboardStats() {
  // 1. Fetch all hives
  const {
    data: hives = [],
    isLoading: hivesLoading,
    error: hivesError,
  } = useQuery({
    queryKey    : ['hives'],
    queryFn     : getHives,
    staleTime   : 30_000,
  });

  // 2. Fetch latest measurement for each hive in parallel
  const latestQueries = useQuery({
    queryKey    : ['hives-latest-all', hives.map(h => h.id)],
    queryFn     : async () => {
      if (!hives.length) return [];
      const results = await Promise.allSettled(
        hives.map(h => getHiveLatest(h.id))
      );
      return results.map((r, i) => ({
        hive_id : hives[i].id,
        data    : r.status === 'fulfilled' ? r.value : null,
      }));
    },
    enabled         : hives.length > 0,
    refetchInterval : 15_000,
    staleTime       : 10_000,
  });

  const latestByHive = latestQueries.data ?? [];

  // 3. Derive the three card values
  const totalHives  = hives.length;

  const doorOpenCount = latestByHive.filter(
    ({ data }) => data?.door_open === true
  ).length;

  const secureCount = latestByHive.filter(
    ({ data }) => data !== null && data?.door_open === false
  ).length;

  // A hive is in alert if: door open, sound spike, high temp, or low battery
  const alertHives = latestByHive.filter(({ data }) => {
    if (!data) return false;
    return (
      data.door_open === true                              ||
      (data.sound_level   ?? 0)   > SOUND_ALERT_THRESHOLD ||
      (data.temperature_c ?? 0)   > 38                    ||
      (data.battery_v     ?? 999) < BATTERY_ALERT_THRESHOLD
    );
  });

  const hasUrgent   = alertHives.length > 0;
  const alertCount  = alertHives.length;

  const isLoading = hivesLoading || latestQueries.isLoading;
  const error     = hivesError   || latestQueries.error;

  return {
    isLoading,
    error,
    // Card 1
    totalHives,
    // Card 2
    hasUrgent,
    alertCount,
    // Card 3
    secureCount,
    doorOpenCount,
    totalWithData : latestByHive.filter(({ data }) => data !== null).length,
  };
}