import { useQuery } from '@tanstack/react-query'
import { getHiveThresholds } from '../api/hives'

const FIFTEEN_MIN = 15 * 60 * 1000

// Fallback used before the fetch resolves — matches GLOBAL_DEFAULTS exactly
export const DEFAULT_THRESHOLDS = {
  temp_attention : 35.0,
  temp_urgente   : 40.0,
  hum_attention  : 70.0,
  hum_urgente    : 80.0,
  battery_v      : 3.5,
  sound_level    : 80,
  weight_drop_kg : null,
}

export function useHiveThresholds(hiveId) {
  const { data, isLoading } = useQuery({
    queryKey  : ['hive-thresholds', hiveId],
    queryFn   : () => getHiveThresholds(hiveId),
    enabled   : !!hiveId,
    staleTime : FIFTEEN_MIN,
    // Thresholds change rarely — only when an admin explicitly edits them.
    // No auto-refetch needed; invalidate the key after a PUT /thresholds.
  })

  return {
    thresholds: data ?? DEFAULT_THRESHOLDS,
    isLoading,
  }
}

// Derive the alert status of a single measurement given a threshold object.
// Used by MetricDetail, HivesField, Dashboard — replaces all hardcoded numbers.
export function measurementAlertStatus(latest, t = DEFAULT_THRESHOLDS) {
  if (!latest) return 'normal'

  const isUrgent = (
    latest.door_open === true                            ||
    (latest.temperature_c ?? 0) > t.temp_urgente        ||
    (latest.humidity_pct  ?? 0) > t.hum_urgente         ||
    (latest.battery_v     ?? 9) < (t.battery_v - 0.3)   // hard low: 0.3V below threshold
  )
  if (isUrgent) return 'urgente'

  const isAttention = (
    (latest.temperature_c ?? 0) > t.temp_attention      ||
    (latest.humidity_pct  ?? 0) > t.hum_attention       ||
    (latest.sound_level   ?? 0) > t.sound_level         ||
    (latest.battery_v     ?? 9) < t.battery_v
  )
  if (isAttention) return 'attention'

  return 'normal'
}

// Count alert crossings in a history array for a specific metric field.
export function countAlerts(history, field, threshold, comparator = 'above') {
  return (history ?? []).filter(d => {
    const v = d[field]
    if (v == null) return false
    return comparator === 'above' ? v > threshold : v < threshold
  }).length
}