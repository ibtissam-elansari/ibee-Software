import { useState, useMemo } from 'react';
import { useHiveList } from '../../../../hooks/useHives';
import { deriveStatus } from '../lib/hiveUtils';

/**
 * useHivesField — manages everything HivesField needs.
 *
 * Extracted from HivesField.jsx so the component is pure rendering.
 * Owns: data fetching, search, filter, modal state, status bar text.
 */
export function useHivesField() {
  const { data: hives = [], isLoading, isError, dataUpdatedAt } = useHiveList();

  const [search,        setSearch]        = useState('');
  const [filter,        setFilter]        = useState('Toutes');
  const [view,          setView]          = useState('list');
  const [selectedHive,  setSelectedHive]  = useState(null);
  const [addModalOpen,  setAddModalOpen]  = useState(false);

  // Client-side search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hives.filter(h =>
      q === '' || (h.name ?? '').toLowerCase().includes(q)
    );
  }, [hives, search]);

  // Last update display string
  const lastUpdateLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return {
    // Data
    hives,
    filtered,
    isLoading,
    isError,

    // UI state
    search,       setSearch,
    filter,       setFilter,
    view,         setView,

    // Modal state
    selectedHive,
    openHiveModal  : setSelectedHive,
    closeHiveModal : () => setSelectedHive(null),
    addModalOpen,
    openAddModal   : () => setAddModalOpen(true),
    closeAddModal  : () => setAddModalOpen(false),

    // Derived display
    lastUpdateLabel,
  };
}