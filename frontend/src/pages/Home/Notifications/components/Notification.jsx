import React from 'react'
import { X } from 'lucide-react'

// Icon per notification type — matches the Figma colored dots
const TYPE_CONFIG = {
  security    : { dot: '#1D5FCA', label: 'Alerte de sécurité',  bg: 'bg-orange-50'  },
  temperature : { dot: '#EF4444', label: 'Alerte Température',  bg: 'bg-red-50'     },
  humidity    : { dot: '#3B82F6', label: 'Humidité Élevée',     bg: 'bg-blue-50'    },
  battery     : { dot: '#F59E0B', label: 'Batterie Faible',     bg: 'bg-amber-50'   },
  sound       : { dot: '#22C55E', label: 'Activité Sonore',     bg: 'bg-green-50'   },
  geofencing  : { dot: '#EF4444', label: 'Hors Zone',           bg: 'bg-red-50'     },
}

const NotificationItem = ({ notification, onDismiss }) => {
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.security

  return (
    <div className={`relative rounded-xl px-4 py-3 ${config.bg}`}>
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(notification.id)}
          className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Type label */}
      <p className="text-xs font-semibold text-gray-700 mb-1 pr-4">
        {notification.title}
      </p>

      {/* Message + icon dot */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-gray-500 leading-relaxed flex-1">
          {notification.message}
        </p>
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: config.dot }}
        />
      </div>

      {/* Time */}
      <p className="text-[10px] text-gray-400 mt-2 text-right">
        {notification.time}
      </p>
    </div>
  )
}

export default NotificationItem