import http from './client'

export const getNotifications = () =>
  http.get('/api/notifications').then(r => r.data)