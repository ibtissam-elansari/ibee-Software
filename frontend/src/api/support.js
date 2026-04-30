// src/api/support.js
import http from './client';

// ── Tickets ──────────────────────────────────────────────────────────────────

/**
 * Create a new support ticket (admin / user)
 * @param {{ title, description, type, priority }} data
 */
export const createTicket = (data) =>
  http.post('/api/support', data).then(r => r.data);

/**
 * List tickets.
 * - Regular users → own tickets only (backend enforces this)
 * - Superuser → all tickets, with optional filters
 * @param {{ status?, type?, priority?, apiculteur_id?, skip?, limit? }} params
 */
export const getTickets = (params = {}) =>
  http.get('/api/support', { params }).then(r => r.data);

/**
 * Get a single ticket by id
 */
export const getTicket = (id) =>
  http.get(`/api/support/${id}`).then(r => r.data);

/**
 * Update a ticket's title / description (owner only, while ouvert)
 */
export const updateTicket = (id, data) =>
  http.patch(`/api/support/${id}`, data).then(r => r.data);

/**
 * Superuser: respond to a ticket (sets response + status + optional priority)
 * @param {number} id
 * @param {{ response, status, priority? }} data
 */
export const respondToTicket = (id, data) =>
  http.post(`/api/support/${id}/respond`, data).then(r => r.data);

/**
 * Superuser: change ticket status only
 * @param {number} id
 * @param {'ouvert'|'en_cours'|'resolu'|'ferme'} status
 */
export const patchTicketStatus = (id, status) =>
  http.patch(`/api/support/${id}/status`, { status }).then(r => r.data);

/**
 * Superuser: delete a ticket permanently
 */
export const deleteTicket = (id) =>
  http.delete(`/api/support/${id}`);