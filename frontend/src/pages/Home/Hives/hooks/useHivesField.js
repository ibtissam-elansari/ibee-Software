// /frontend/src/pages/Home/Hives/hooks/useHivesField.js
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useQuery }    from '@tanstack/react-query'
import { useParams }   from 'react-router-dom'
import { useHiveList } from '../../../../hooks/useHives'
import { getHiveLatest } from '../../../../api/hives'
import { measurementAlertStatus, DEFAULT_THRESHOLDS } from '../../../../hooks/useHiveThresholds'

// ---------------------------------------------------------------------------
// Compute columns from container width (mirrors HiveGrid.jsx breakpoints)
// ---------------------------------------------------------------------------
function getCols(containerWidth) {
  if (containerWidth >= 1280) return 4
  if (containerWidth >= 1024) return 3
  if (containerWidth >= 640)  return 2
  return 1
}

// ---------------------------------------------------------------------------
// Compute rows that fit in the available height.
// ---------------------------------------------------------------------------
const CARD_HEIGHT   = 190  // px — approximate rendered grid card height
const ROW_HEIGHT    = 57   // px — approximate list row height
const GAP           = 12   // gap-3
const MIN_ROWS      = 2
const MIN_ROWS_LIST = 4

function getPageSize(view, containerWidth, containerHeight) {
  const cols = getCols(containerWidth)

  if (view === 'list') {
    const rows = Math.max(MIN_ROWS_LIST, Math.floor(containerHeight / (ROW_HEIGHT + GAP)))
    return rows
  }

  // Grid: how many complete rows fit in the available height?
  const rows = Math.max(MIN_ROWS, Math.floor(containerHeight / (CARD_HEIGHT + GAP)))
  return cols * rows
}

// ---------------------------------------------------------------------------
// Fetch all hives + bulk-fetch latest readings
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
// Main hook
// ---------------------------------------------------------------------------
export function useHivesField() {
  const { apiculteurId } = useParams()
  const { hives, isLoading, isError, lastUpdated } = useAllHivesWithLatest(apiculteurId)

  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('Toutes')
  const [view,         setView]         = useState('grid')
  const [page,         setPage]         = useState(1)
  const [pageSize,     setPageSize]     = useState(8)
  const [selectedHive, setSelectedHive] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  // Attach to the grid/list container div in HivesField.jsx
  const containerRef = useRef(null)

  const recalculate = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    if (width === 0 || height === 0) return
    setPageSize(getPageSize(view, width, height))
  }, [view])

  // ResizeObserver watches the container — fires on both width AND height changes
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    recalculate()
    const ro = new ResizeObserver(recalculate)
    ro.observe(el)
    return () => ro.disconnect()
  }, [recalculate])

  // Reset to page 1 whenever filters, search, or computed page size changes
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
    containerRef,   // ← spread onto the grid/list wrapper div in HivesField.jsx
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