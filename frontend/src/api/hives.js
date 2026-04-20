// api/hives.js
import http from './client';

// ── Hive CRUD ────────────────────────────────────────────────────────────────
export const getHives    = ()         => http.get('/api/hives').then(r => r.data);
export const getHive     = (id)       => http.get(`/api/hives/${id}`).then(r => r.data);
export const createHive  = (data)     => http.post('/api/hives', data).then(r => r.data);
export const updateHive  = (id, data) => http.patch(`/api/hives/${id}`, data).then(r => r.data);
export const deleteHive  = (id)       => http.delete(`/api/hives/${id}`);

// ── Hive data ────────────────────────────────────────────────────────────────
export const getHiveLatest  = (id)           => http.get(`/api/hives/${id}/latest`).then(r => r.data);
export const getHiveHistory = (id, limit = 200, start = null, end = null) => {
  const params = { limit }
  if (start) params.start = start
  if (end)   params.end   = end
  return http.get(`/api/hives/${id}/history`, { params }).then(r => r.data)
}
export const getHiveStats   = (id)           => http.get(`/api/hives/${id}/stats`).then(r => r.data);