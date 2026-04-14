import React from 'react'
import { X, Lock, Thermometer, Droplets, Battery, Volume2, MapPin } from 'lucide-react'

const TYPE_CONFIG = {
  security: {
    bg         : 'bg-orange-50',
    titleColor : 'text-orange-500',
    label      : 'Alerte de sécurité',
    Icon       : Lock,
    iconColor  : '#1D5FCA',   // blue lock — matches Figma exactly
  },
  temperature: {
    bg         : 'bg-red-50',
    titleColor : 'text-red-500',
    label      : 'Alerte Température',
    Icon       : Thermometer,
    iconColor  : '#EF4444',
  },
  humidity: {
    bg         : 'bg-blue-50',
    titleColor : 'text-blue-500',
    label      : 'Humidité Élevée',
    Icon       : Droplets,
    iconColor  : '#3B82F6',
  },
  battery: {
    bg         : 'bg-amber-50',
    titleColor : 'text-amber-500',
    label      : 'Batterie Faible',
    Icon       : Battery,
    iconColor  : '#F59E0B',
  },
  sound: {
    bg         : 'bg-green-50',
    titleColor : 'text-green-600',
    label      : 'Activité Sonore',
    Icon       : Volume2,
    iconColor  : '#22C55E',
  },
  geofencing: {
    bg         : 'bg-red-50',
    titleColor : 'text-red-500',
    label      : 'Hors Zone (Geofencing)',
    Icon       : MapPin,
    iconColor  : '#EF4444',
  },
}

const FALLBACK = TYPE_CONFIG.security

const NotificationItem = ({ notification, onDismiss }) => {
  const config = TYPE_CONFIG[notification.type] ?? FALLBACK
  const { Icon } = config

  return (
    <div className={`relative rounded-xl px-4 py-3 ${config.bg}`}>

      {/* Dismiss — top right */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(notification.id)}
          className="absolute top-2.5 right-2.5 text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="Ignorer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Title — colored, matches notification type */}
      <p className={`text-xs font-semibold mb-1.5 pr-5 ${config.titleColor}`}>
        {notification.title}
      </p>

      {/* Message row — text left, icon right */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-gray-600 leading-relaxed flex-1">
          {notification.message}
        </p>
        <Icon
          className="flex-shrink-0 mt-0.5"
          style={{ color: config.iconColor, width: 14, height: 14 }}
        />
      </div>

      {/* Timestamp — bottom right */}
      <p className="text-[10px] text-gray-400 mt-2 text-right">
        {notification.time}
      </p>
    </div>
  )
}

export default NotificationItem