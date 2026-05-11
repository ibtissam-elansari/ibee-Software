import { useMemo } from 'react'
import { useHiveLatest }      from '../../../../hooks/useHives'
import { useHiveThresholds, measurementAlertStatus } from '../../../../hooks/useHiveThresholds'

const STATUS_MAP = {
  urgente   : { label: 'Urgent',    color: 'text-red-500',    rowBg: 'bg-red-50/40',    accent: 'border-l-4 border-l-red-400'   },
  attention : { label: 'Attention', color: 'text-amber-500',  rowBg: 'bg-amber-50/30',  accent: 'border-l-4 border-l-amber-400' },
  normal    : { label: 'Normale',   color: 'text-green-600',  rowBg: 'hover:bg-gray-50', accent: ''                              },
}

function batteryPct(v) {
  if (v == null) return null
  return Math.min(100, Math.max(0, Math.round(((v - 3.3) / 0.9) * 100)))
}

export function useHiveRow(hiveId, latestProp) {
  const { data: fetched, isLoading } = useHiveLatest(hiveId, { enabled: !latestProp })
  const latest = latestProp ?? fetched

  // Thresholds — respects per-hive profile set by admin
  const { thresholds } = useHiveThresholds(hiveId)

  const display = useMemo(() => {
    if (!latest) return {
      status: 'Normale', statusColor: 'text-green-600',
      rowBg: 'hover:bg-gray-50', leftAccent: '',
      urgent: false,
      temp: null, tempColor: '',
      humidity: null, humidityColor: '',
      soundHz: '—', soundColor: '',
      batteryPct: null,
      rssi: null,
      doorOpen: null,
      hive_state: null,
      ai_confidence: null,
    }

    const alertStatus = measurementAlertStatus(latest, thresholds)
    const s           = STATUS_MAP[alertStatus] ?? STATUS_MAP.normal

    const temp     = latest.temperature_c
    const humidity = latest.humidity_pct
    const sound    = latest.sound_level
    const weight   = latest.weight_kg

    return {
      status      : s.label,
      statusColor : s.color,
      rowBg       : s.rowBg,
      leftAccent  : s.accent,
      urgent      : alertStatus === 'urgente',

      temp,
      tempColor     : temp > thresholds.temp_urgente   ? 'text-red-500'
                    : temp > thresholds.temp_attention  ? 'text-amber-500'
                    : '',

      humidity,
      humidityColor : humidity > thresholds.hum_urgente  ? 'text-red-500'
                    : humidity > thresholds.hum_attention ? 'text-amber-500'
                    : '',

      soundHz   : sound != null ? `${sound * 2}Hz` : '—',
      soundColor: sound > thresholds.sound_level ? 'text-red-500' : '',

      weight,
      batteryPct : batteryPct(latest.battery_v),
      rssi       : latest.rssi,
      doorOpen   : latest.door_open,

      // AI predictions (from backend predict.py)
      hive_state    : latest.hive_state    ?? null,
      ai_confidence : latest.ai_confidence ?? null,
    }
  }, [latest, thresholds])

  return { isLoading: isLoading && !latestProp, display, latest }
}