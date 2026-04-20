import http from './client'

export const getAlertLog = (params = {}) =>
  http.get('/api/alert-stats/log', { params }).then(r => r.data)

export const getDailyAlertCounts = (params = {}) =>
  http.get('/api/alert-stats/daily', { params }).then(r => r.data)

export const getWeeklyUrgentCounts = () =>
  http.get('/api/alert-stats/weekly').then(r => r.data)