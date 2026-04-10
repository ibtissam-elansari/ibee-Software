// /api/auth.js
import http from './client';

export const login = (data) =>
  http.post('/auth/login', data).then(res => res.data);