// api/alertStats.js
import http from './client'

export const getAlertLog = (params = {}) =>
  http.get('/api/alert-stats/log', { params }).then(r => r.data)

export const getDailyAlertCounts = (params = {}) =>
  http.get('/api/alert-stats/daily', { params }).then(r => r.data)

export const getWeeklyUrgentCounts = (start, end, apiculteurId, hiveId) => {
  const params = {}
  if (start)        params.start         = start
  if (end)          params.end           = end
  if (apiculteurId) params.apiculteur_id = apiculteurId
  if (hiveId)       params.hive_id       = hiveId
  return http.get('/api/alert-stats/weekly', { params }).then(r => r.data)
}

/**
 * Per-sensor daily timeline.
 * Returns SensorDayStats[]: { date, min, max, avg, count }
 *
 * @param {'temperature'|'humidity'|'battery'|'sound'|'security'} sensorType
 */
export const getSensorTimeline = (sensorType, params = {}) =>
  http
    .get('/api/alert-stats/sensor-timeline', {
      params: { sensor_type: sensorType, ...params },
    })
    .then(r => r.data)