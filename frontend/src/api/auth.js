// src/api/auth.js
import http from './client'

export const login = ({ email, password }) => {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return http.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then(r => r.data)
}

/**
 * Register a test account — creates user with is_pending=true.
 * Backend: POST /auth/register
 * Body: { full_name, email, password, company_name?, reason? }
 */
export const registerTestAccount = (data) =>
  http.post('/auth/register', data).then(r => r.data)

/**
 * Request a password-reset link.
 * Backend: POST /auth/forgot-password  { email }
 */
export const forgotPassword = (email) =>
  http.post('/auth/forgot-password', { email }).then(r => r.data)

/**
 * Confirm password reset with token from email link.
 * Backend: POST /auth/reset-password  { token, new_password }
 */
export const resetPassword = (token, newPassword) =>
  http.post('/auth/reset-password', { token, new_password: newPassword }).then(r => r.data)

export const getMe      = ()         => http.get('/auth/me').then(r => r.data)
export const getUsers   = ()         => http.get('/auth/users').then(r => r.data)
export const createUser = (data)     => http.post('/auth/users', data).then(r => r.data)
export const updateUser = (id, data) => http.patch(`/auth/users/${id}`, data).then(r => r.data)
export const deleteUser = (id)       => http.delete(`/auth/users/${id}`)

// ── Pending account management (superuser) ────────────────────────────────────

/** List accounts awaiting approval. Backend: GET /auth/users?is_pending=true */
export const getPendingUsers = () =>
  http.get('/auth/users', { params: { is_pending: true } }).then(r => r.data)

/**
 * Approve a pending account and assign it to a cooperative.
 * Backend: PATCH /auth/users/:id  { is_pending: false, apiculteur_id }
 */
export const approveUser = (id, apiculteurId) =>
  http.patch(`/auth/users/${id}`, {
    is_pending: false,
    apiculteur_id: apiculteurId,
  }).then(r => r.data)

/** Reject and delete a pending account. */
export const rejectUser = (id) => http.delete(`/auth/users/${id}`)