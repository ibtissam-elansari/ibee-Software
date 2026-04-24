// api/alertStats.js
import http from './client'

export const getAlertLog = (params = {}) =>
  http.get('/api/alert-stats/log', { params }).then(r => r.data)

export const getDailyAlertCounts = (params = {}) =>
  http.get('/api/alert-stats/daily', { params }).then(r => r.data)

// Added apiculteurId param — passed as apiculteur_id query param to backend
export const getWeeklyUrgentCounts = (start, end, apiculteurId) => {
  const params = {}
  if (start)        params.start          = start
  if (end)          params.end            = end
  if (apiculteurId) params.apiculteur_id  = apiculteurId
  return http.get('/api/alert-stats/weekly', { params }).then(r => r.data)
}