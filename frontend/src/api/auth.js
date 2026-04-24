// /api/auth.js
import http from './client';

export const login = ({ email, password }) => {
  const formData = new URLSearchParams();
  formData.append('username', email);   // ⚠️ must be "username"
  formData.append('password', password);

  return http.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then(r => r.data);
};
export const getMe      = ()         => http.get('/auth/me').then(r => r.data);
export const getUsers   = ()         => http.get('/auth/users').then(r => r.data);
export const createUser = (data)     => http.post('/auth/users', data).then(r => r.data);
export const updateUser = (id, data) => http.patch(`/auth/users/${id}`, data).then(r => r.data);
export const deleteUser = (id)       => http.delete(`/auth/users/${id}`);