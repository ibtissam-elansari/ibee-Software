import axios from 'axios'

const http = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 8000,
})

// Get all hives
export const getHives = () =>
  http.get('/api/hives').then(r => r.data)

// Get one hive
export const getHive = (hiveId) =>
  http.get(`/api/hives/${hiveId}`).then(r => r.data)

// Get the latest measurement for a hive
export const getLatest = (hiveId) =>
  http.get(`/api/hives/${hiveId}/latest`).then(r => r.data)

// Get history for a device (last N points, newest first)
export const getHistory = (devEui, limit = 100) =>
  http.get(`/api/devices/${devEui}/history`, {
    params: { limit },
  }).then(r => r.data)