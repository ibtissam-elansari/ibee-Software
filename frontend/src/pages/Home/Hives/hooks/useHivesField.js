// /frontend/src/pages/Home/Hives/hooks/useHivesField.js
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery }      from '@tanstack/react-query'
import { useParams }     from 'react-router-dom'
import { useHiveList }   from '../../../../hooks/useHives'
import { getHiveLatest } from '../../../../api/hives'
import { measurementAlertStatus, DEFAULT_THRESHOLDS } from '../../../../hooks/useHiveThresholds'

// ---------------------------------------------------------------------------
// Page size: cols × rows, purely from window width.
// Matches HiveGrid breakpoints exactly:
//   default : 1 col  (< 640)
//   sm      : 2 cols (≥ 640)
//   lg      : 3 cols (≥ 1024)
//   xl      : 4 cols (≥ 1280)
//
// For list view we just pick a sensible flat number by width.
// ---------------------------------------------------------------------------
function getPageSize(view) {
  const w = window.innerWidth

  if (view === 'list') {
    if (w >= 1280) return 12
    if (w >= 1024) return 10
    if (w >= 640)  return 8
    return 6
  }

  // Grid: cols × how many rows look good without huge empty space
  if (w >= 1280) return 8   // 4 cols × 2 rows
  if (w >= 1024) return 6   // 3 cols × 2 rows
  if (w >= 640)  return 6   // 2 cols × 3 rows
  return 4                  // 1 col  × 4 rows
}

// ---------------------------------------------------------------------------
function useAllHivesWithLatest(apiculteurId) {
  const { data: hives = [], isLoading, isError } = useHiveList(apiculteurId)

  const latestQuery = useQuery({
    queryKey       : ['hives-latest-all', apiculteurId, hives.map(h => h.id)],
    queryFn        : async () => {
      if (!hives.length) return []
      const results = await Promise.allSettled(hives.map(h => getHiveLatest(h.id)))
      return results.map((r, i) => ({
        ...hives[i],
        _latest: r.status === 'fulfilled' ? r.value : null,
      }))
    },
    enabled        : hives.length > 0,
    staleTime      : 10_000,
    refetchInterval: 15_000,
  })

  return {
    hives      : latestQuery.data ?? hives.map(h => ({ ...h, _latest: null })),
    isLoading  : isLoading || latestQuery.isLoading,
    isError    : isError   || latestQuery.isError,
    lastUpdated: latestQuery.dataUpdatedAt,
  }
}

function getHiveStatus(latest) {
  const status = measurementAlertStatus(latest, DEFAULT_THRESHOLDS)
  return status === 'urgente' ? 'Urgente' : status === 'attention' ? 'Attention' : 'Normale'
}

// ---------------------------------------------------------------------------
export function useHivesField() {
  const { apiculteurId } = useParams()
  const { hives, isLoading, isError, lastUpdated } = useAllHivesWithLatest(apiculteurId)

  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('Toutes')
  const [view,         setView]         = useState('grid')
  const [page,         setPage]         = useState(1)
  const [pageSize,     setPageSize]     = useState(() => getPageSize('grid'))
  const [selectedHive, setSelectedHive] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const recalculate = useCallback(() => {
    setPageSize(getPageSize(view))
  }, [view])

  useEffect(() => {
    recalculate()
    window.addEventListener('resize', recalculate)
    return () => window.removeEventListener('resize', recalculate)
  }, [recalculate])

  // Reset page when anything affecting the list changes
  useEffect(() => { setPage(1) }, [search, filter, pageSize])

  const enriched = useMemo(() =>
    hives.map(h => ({ ...h, _status: getHiveStatus(h._latest) })),
    [hives]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter(h => {
      const matchSearch = !q || h.name?.toLowerCase().includes(q)
      const matchFilter = filter === 'Toutes' || h._status === filter
      return matchSearch && matchFilter
    })
  }, [enriched, search, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const lastUpdateLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null

  return {
    paginated,
    filtered,
    page         : safePage,
    totalPages,
    setPage,
    totalCount   : filtered.length,
    isLoading,
    isError,
    search,      setSearch,
    filter,      setFilter,
    view,        setView,
    selectedHive,
    openHiveModal : (hive) => setSelectedHive(hive),
    closeHiveModal: ()     => setSelectedHive(null),
    addModalOpen,
    openAddModal  : ()     => setAddModalOpen(true),
    closeAddModal : ()     => setAddModalOpen(false),
    lastUpdateLabel,
  }
}