// /api/auth.js
import http from './client';

export const login      = (data)     => http.post('/auth/login', data).then(r => r.data);
export const getMe      = ()         => http.get('/auth/me').then(r => r.data);
export const getUsers   = ()         => http.get('/auth/users').then(r => r.data);
export const createUser = (data)     => http.post('/auth/users', data).then(r => r.date);
export const updateUser = (id, data) => http.patch(`/auth/users/${id}`, data).then(r => r.data);
export const deleteUser = (id)       => http.delete(`/auth/users/${id}`);