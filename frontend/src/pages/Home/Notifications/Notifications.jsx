import React, { useState } from 'react';
import { Bell, SlidersHorizontal } from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationItem from './components/Notification';

const Notifications = () => {
  const { data: notifications = [], isLoading } = useNotifications();

  const [dismissed, setDismissed] = useState(new Set());
  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));

  const visible = notifications.filter(n => !dismissed.has(n.id));
  const count   = visible.length;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
        <button className="text-gray-300 hover:text-gray-500 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* Count + filter row */}
      <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
        <p className="text-xs text-gray-400">
          {isLoading
            ? 'Chargement...'
            : count === 0
            ? 'Aucune alerte active'
            : `${count} notification${count > 1 ? 's' : ''}`
          }
        </p>
        <button className="text-gray-300 hover:text-gray-500 transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-3 flex-shrink-0" />

      {/* Notification list — scrolls independently */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-50 animate-pulse" />
          ))
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Toutes les ruches fonctionnent normalement
            </p>
          </div>
        ) : (
          visible.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onDismiss={dismiss}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;