// store/useHiveStore.js
import { create } from 'zustand';

const useHiveStore = create((set) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  hives        : [],
  selectedHive : null,

  // ── Setters ────────────────────────────────────────────────────────────────
  setHives        : (hives) => set({ hives }),
  setSelectedHive : (hive)  => set({ selectedHive: hive }),

  // ── Optimistic updates (called after confirmed API response) ───────────────
  addHive    : (hive)     => set(s => ({ hives: [...s.hives, hive] })),

  removeHive : (id)       => set(s => ({
    hives       : s.hives.filter(h => h.id !== id),
    selectedHive: s.selectedHive?.id === id ? null : s.selectedHive,
  })),

  updateHive : (id, data) => set(s => ({
    hives: s.hives.map(h => h.id === id ? { ...h, ...data } : h),
  })),
}));

export default useHiveStore;