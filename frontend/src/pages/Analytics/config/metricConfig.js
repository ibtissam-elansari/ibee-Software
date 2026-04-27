import { Thermometer, Droplets, Volume2, Scale } from 'lucide-react'

export const METRIC_CONFIG = {
  temperature: {
    label          : 'TEMP',
    fullLabel      : 'Température',
    unit           : '°C',
    chartKey       : 'Température (°C)',
    chartColor     : '#D97706',
    Icon           : Thermometer,
    iconBg         : 'bg-orange-50',
    iconColor      : '#D97706',
    alertThreshold : 38,
    scale          : v => v,
  },
  humidity: {
    label          : 'HUM',
    fullLabel      : 'Humidité',
    unit           : '%',
    chartKey       : 'Humidité (%)',
    chartColor     : '#3B82F6',
    Icon           : Droplets,
    iconBg         : 'bg-blue-50',
    iconColor      : '#3B82F6',
    alertThreshold : 75,
    scale          : v => v,
  },
  sound: {
    label          : 'SON',
    fullLabel      : 'Niveau Sonore',
    unit           : 'Hz',
    chartKey       : 'Niveau Sonore (Hz)',
    chartColor     : '#22C55E',
    Icon           : Volume2,
    iconBg         : 'bg-green-50',
    iconColor      : '#22C55E',
    alertThreshold : 70,
    scale          : v => v * 2,
  },
  weight: {
    label          : 'POIDS',
    fullLabel      : 'Poids',
    unit           : 'kg',
    chartKey       : 'Poids (kg)',
    chartColor     : '#1C1C1C',
    Icon           : Scale,
    iconBg         : 'bg-gray-100',
    iconColor      : '#374151',
    alertThreshold : 50,   // configurable — e.g. drop > 50 kg triggers alert
    scale          : v => v,
  },
}

export const METRIC_KEYS = Object.keys(METRIC_CONFIG)