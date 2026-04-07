import { useState, useEffect } from 'react'
import { getHives, getStats } from '../api/client'

const API = 'http://localhost:8000'

export function useHiveData(hiveId) {
  const [hives,   setHives]   = useState([])
  const [latest,  setLatest]  = useState(null)
  const [history, setHistory] = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── Load hive list once on mount ─────────────────────────────────────────
  useEffect(() => {
    getHives()
      .then(setHives)
      .catch(e => setError(e.message))
  }, [])

  // ── Load initial history + stats when hiveId changes ─────────────────────
  useEffect(() => {
    if (!hiveId) return
    setLoading(true)

    fetch(`${API}/api/hives/${hiveId}/history?limit=100`)
      .then(r => {
        if (!r.ok) throw new Error(`History fetch failed: HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setHistory(data)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })

    getStats(hiveId)
      .then(setStats)
      .catch(() => {})

  }, [hiveId])

  // ── SSE live stream ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hiveId) return

    const es = new EventSource(`${API}/api/hives/${hiveId}/stream`)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setLatest(data)
        setHistory(prev => {
          const updated = [...prev.slice(-99), data]
          if (updated.length % 10 === 0) {
            getStats(hiveId).then(setStats).catch(() => {})
          }
          return updated
        })
        setError(null)
        setLoading(false)
      } catch {
        // keep-alive comment from server — ignore
      }
    }

    es.onerror = () => {
      setError('Stream reconnecting…')
    }

    return () => es.close()
  }, [hiveId])

  return { hives, latest, history, stats, loading, error }
}