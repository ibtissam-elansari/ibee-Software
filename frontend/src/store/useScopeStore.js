import { create } from 'zustand';

const useScopeStore = create((set) => ({
  /** { id: number, company_name: string } | null */
  scopedApiculteur: null,

  setScopedApiculteur: (apiculteur) => set({ scopedApiculteur: apiculteur }),

  clearScope: () => set({ scopedApiculteur: null }),
}));

export default useScopeStore;