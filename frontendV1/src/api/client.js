import axios from 'axios'

const http = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 8000,
})

// ── Hive endpoints ───────────────────────────────────────────────────────────
export const getHives   = ()              => http.get('/api/hives').then(r => r.data)
export const getHive    = (id)            => http.get(`/api/hives/${id}`).then(r => r.data)
export const getLatest  = (id)            => http.get(`/api/hives/${id}/latest`).then(r => r.data)
export const getStats   = (id)            => http.get(`/api/hives/${id}/stats`).then(r => r.data)
export const getHistory = (id, limit=100) => http.get(`/api/hives/${id}/history`, { params: { limit } }).then(r => r.data)

// ── Device endpoints ─────────────────────────────────────────────────────────
export const getDeviceHistory = (devEui, limit=100) =>
  http.get(`/api/devices/${devEui}/history`, { params: { limit } }).then(r => r.data)