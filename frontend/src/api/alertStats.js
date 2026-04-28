// api/alertStats.js
import http from './client'

export const getAlertLog = (params = {}) =>
  http.get('/api/alert-stats/log', { params }).then(r => r.data)

export const getDailyAlertCounts = (params = {}) =>
  http.get('/api/alert-stats/daily', { params }).then(r => r.data)

export const getWeeklyUrgentCounts = (start, end, apiculteurId, hiveId) => {
  const params = {}
  if (start)         params.start          = start
  if (end)           params.end            = end
  if (apiculteurId)  params.apiculteur_id  = apiculteurId
  if (hiveId)        params.hive_id        = hiveId
  return http.get('/api/alert-stats/weekly', { params }).then(r => r.data)
}