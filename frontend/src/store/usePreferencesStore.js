// store/usePreferencesStore.js
//
// Stores UI-only preferences in localStorage.
// No backend round-trip needed — these are per-device settings.
// Dark mode: applies a 'dark' class to <html> via a side-effect.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const applyDarkMode = (enabled) => {
  if (enabled) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const usePreferencesStore = create(
  persist(
    (set, get) => ({
      // Notification preferences
      notifUrgentOnly : true,
      notifAllAlerts  : true,

      // Accessibility
      darkMode: false,

      // ── Setters ──────────────────────────────────────────────────────────────
      setNotifUrgentOnly : (v) => set({ notifUrgentOnly: v }),
      setNotifAllAlerts  : (v) => set({ notifAllAlerts:  v }),

      setDarkMode: (v) => {
        applyDarkMode(v)
        set({ darkMode: v })
      },

      // Called on app boot to re-apply dark mode if it was previously enabled
      hydrate: () => {
        applyDarkMode(get().darkMode)
      },
    }),
    {
      name    : 'ibee-preferences',   // localStorage key
      version : 1,
    }
  )
)

export default usePreferencesStore