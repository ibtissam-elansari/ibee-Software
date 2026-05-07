// /frontend/src/pages/Home/Hives/hooks/useHivesField.js
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery }    from '@tanstack/react-query'
import { useParams }   from 'react-router-dom'
import { useHiveList } from '../../../../hooks/useHives'
import { getHiveLatest } from '../../../../api/hives'
import { measurementAlertStatus, DEFAULT_THRESHOLDS } from '../../../../hooks/useHiveThresholds'

function getPageSize(view) {
  const w = window.innerWidth

  if (view === 'list') {
    // Approximate: total viewport minus topbar (~56px) minus card chrome (~220px)
    const availableHeight = window.innerHeight - 56 - 220
    const rowHeight       = 57
    return Math.max(5, Math.floor(availableHeight / rowHeight))
  }

  // Grid view — match the breakpoints used in HiveGrid.jsx:
  //   default : 1 col  →  show 4  rows → 4
  //   sm(640) : 2 cols →  show 3  rows → 6
  //   lg(1024): 3 cols →  show 2  rows → 6
  //   xl(1280): 4 cols →  show 2  rows → 8
  if (w >= 1280) return 8   // 4 cols × 2 rows
  if (w >= 1024) return 6   // 3 cols × 2 rows
  if (w >= 640)  return 6   // 2 cols × 3 rows
  return 4                  // 1 col  × 4 rows
}

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
// Main hook
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

  // Recalculate page size when view changes or window resizes
  const recalculate = useCallback(() => {
    setPageSize(getPageSize(view))
  }, [view])

  useEffect(() => {
    recalculate()
    window.addEventListener('resize', recalculate)
    return () => window.removeEventListener('resize', recalculate)
  }, [recalculate])

  // Reset to page 1 whenever filters, search, or page size change
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