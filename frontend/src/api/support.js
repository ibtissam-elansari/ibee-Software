// src/api/support.js
import http from './client'

export const createTicket      = (data)         => http.post('/api/support', data).then(r => r.data)
export const getTickets        = (params = {})  => http.get('/api/support', { params }).then(r => r.data)
export const getTicket         = (id)           => http.get(`/api/support/${id}`).then(r => r.data)
export const updateTicket      = (id, data)     => http.patch(`/api/support/${id}`, data).then(r => r.data)
export const respondToTicket   = (id, data)     => http.post(`/api/support/${id}/respond`, data).then(r => r.data)
export const patchTicketStatus = (id, status)   => http.patch(`/api/support/${id}/status`, { status }).then(r => r.data)
export const deleteTicket      = (id)           => http.delete(`/api/support/${id}`)

/**
 * Pre-auth contact — wraps createTicket.
 * The catch in useContactSupport handles auth failures gracefully.
 */
export const sendSupportMessage = ({ name, email, message }) =>
  createTicket({
    title      : `[Contact] ${name}`,
    description: `De : ${name} <${email}>\n\n${message}`,
    type       : 'assistance',
    priority   : 'normale',
  })