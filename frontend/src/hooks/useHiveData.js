import { useState, useEffect, useCallback } from 'react'
import { getHives, getLatest, getHistory } from '../api/client'

const POLL_INTERVAL_MS = 10_000

export function useHiveData(hiveId) {
  const [hives,   setHives]   = useState([])
  const [latest,  setLatest]  = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Load hive list once on mount
  useEffect(() => {
    getHives()
      .then(setHives)
      .catch(e => setError(e.message))
  }, [])

  const fetchData = useCallback(() => {
    if (!hiveId) return
    Promise.all([
      getLatest(hiveId),
      // history is fetched by dev_eui — we get it from latest
    ])
      .then(([lat]) => {
        setLatest(lat)
        setError(null)
        return getHistory(lat.device_dev_eui, 100)
      })
      .then(hist => {
        // API returns newest-first; reverse for charts (oldest → newest)
        setHistory([...hist].reverse())
        setLoading(false)
      })
      .catch(e => {
        setError(e.response?.data?.detail || e.message)
        setLoading(false)
      })
  }, [hiveId])

  // Initial fetch + polling
  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchData])

  return { hives, latest, history, loading, error }
}