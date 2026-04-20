import http from './client'

export const getAlertLog = (params = {}) =>
  http.get('/api/alert-stats/log', { params }).then(r => r.data)

export const getDailyAlertCounts = (params = {}) =>
  http.get('/api/alert-stats/daily', { params }).then(r => r.data)

export const getWeeklyUrgentCounts = (start, end) =>
  http.get('/api/alert-stats/weekly', { params: { start, end } }).then(r => r.data)