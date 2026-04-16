import { Thermometer, Droplets, Volume2 } from 'lucide-react'

export const METRIC_CONFIG = {
  temperature: {
    label       : 'TEMP',
    fullLabel   : 'Température',
    unit        : '°C',
    chartKey    : 'Température (°C)',
    chartColor  : '#D97706',
    Icon        : Thermometer,
    iconBg      : 'bg-red-50',
    iconColor   : '#EF4444',
    alertThreshold: 38,
    scale       : v => v,
  },
  humidity: {
    label       : 'HUM',
    fullLabel   : 'Humidité',
    unit        : '%',
    chartKey    : 'Humidité (%)',
    chartColor  : '#3B82F6',
    Icon        : Droplets,
    iconBg      : 'bg-blue-50',
    iconColor   : '#3B82F6',
    alertThreshold: 75,
    scale       : v => v,
  },
  sound: {
    label       : 'SON',
    fullLabel   : 'Niveau Sonore',
    unit        : 'Hz',
    chartKey    : 'Niveau Sonore (Hz)',
    chartColor  : '#22C55E',
    Icon        : Volume2,
    iconBg      : 'bg-green-50',
    iconColor   : '#22C55E',
    alertThreshold: 70,
    scale       : v => v * 2,
  },
}

export const METRIC_KEYS = Object.keys(METRIC_CONFIG)