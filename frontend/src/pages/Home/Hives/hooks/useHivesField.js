// /Home/Hives/hooks/useHivesField.js

import { useState, useMemo } from 'react'
import { useHiveList, useAllHivesLatest } from '../../../../hooks/useHives'
import { deriveStatus } from '../utils'  // adjust path as needed

const PAGE_SIZE = 8

export function useHivesField() {
  const { data: hives = [], isLoading, isError, dataUpdatedAt } = useHiveList()

  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('Toutes')
  const [view,         setView]         = useState('list')
  const [selectedHive, setSelectedHive] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [page,         setPage]         = useState(1)

  // Fetch latest sensor data for every hive in parallel
  const hiveIds = useMemo(() => hives.map(h => h.id), [hives])
  const latestQueries = useAllHivesLatest(hiveIds)

  // Build a id → latest map
  const latestByHiveId = useMemo(() => {
    const map = {}
    hives.forEach((hive, i) => {
      const data = latestQueries[i]?.data ?? null
      map[hive.id] = data
    })
    return map
  }, [hives, latestQueries])

  // Enrich each hive with its derived status
  const enrichedHives = useMemo(() =>
    hives.map(hive => {
      const m = latestByHiveId[hive.id]
      const status = m
        ? deriveStatus(m.temperature_c, m.humidity_pct, m.sound_level, m.door_open)
        : 'Inconnue'
      return { ...hive, _status: status, _latest: m }
    }),
    [hives, latestByHiveId]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enrichedHives.filter(h => {
      const matchesSearch = q === '' || (h.name ?? '').toLowerCase().includes(q)
      const matchesFilter = filter === 'Toutes' || h._status === filter
      return matchesSearch && matchesFilter
    })
  }, [enrichedHives, search, filter])

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
    hives: enrichedHives,
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
    latestByHiveId,   // expose if HiveRow needs it to avoid double-fetching
  }
}