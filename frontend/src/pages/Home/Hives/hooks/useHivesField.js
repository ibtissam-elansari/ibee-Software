// /Home/Hives/hooks/useHivesField

import { useState, useMemo } from 'react'
import { useHiveList } from '../../../../hooks/useHives'

const PAGE_SIZE = 8

export function useHivesField() {
  const { data: hives = [], isLoading, isError, dataUpdatedAt } = useHiveList()

  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('Toutes')
  const [view,         setView]         = useState('list')
  const [selectedHive, setSelectedHive] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [page,         setPage]         = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    // Name search only — status filter needs sensor data which
    // is loaded async per row, not available here
    return hives.filter(h =>
      q === '' || (h.name ?? '').toLowerCase().includes(q)
    )
  }, [hives, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  const lastUpdateLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit',
      })
    : null

  const handleSetSearch = (v) => { setSearch(v); setPage(1) }
  const handleSetFilter = (v) => { setFilter(v); setPage(1) }

  return {
    hives,
    filtered,
    paginated,
    isLoading,
    isError,
    search,       setSearch: handleSetSearch,
    filter,       setFilter: handleSetFilter,
    view,         setView,
    page: safePage,
    totalPages,
    setPage,
    totalCount: filtered.length,
    selectedHive,
    openHiveModal  : setSelectedHive,
    closeHiveModal : () => setSelectedHive(null),
    addModalOpen,
    openAddModal   : () => setAddModalOpen(true),
    closeAddModal  : () => setAddModalOpen(false),
    lastUpdateLabel,
  }
}