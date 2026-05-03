// /frontend/src/pages/Home/Hives/hooks/useHivesField.js
import { useState, useMemo } from 'react'
import { useQuery }          from '@tanstack/react-query'
import { useParams }         from 'react-router-dom'
import { useHiveList, useHiveLatest } from '../../../../hooks/useHives'
import { getHiveLatest }     from '../../../../api/hives'
import { measurementAlertStatus, DEFAULT_THRESHOLDS } from '../../../../hooks/useHiveThresholds'

const PAGE_SIZE = 8

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
  // Map internal status names to the display labels already used by the filter UI
  return status === 'urgente' ? 'Urgente' : status === 'attention' ? 'Attention' : 'Normale'
}

export function useHivesField() {
  const { apiculteurId } = useParams()

  const { hives, isLoading, isError, lastUpdated } = useAllHivesWithLatest(apiculteurId)

  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('Toutes')
  const [view,      setView]      = useState('grid')
  const [page,      setPage]      = useState(1)
  const [selectedHive,  setSelectedHive]  = useState(null)
  const [addModalOpen,  setAddModalOpen]  = useState(false)

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

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