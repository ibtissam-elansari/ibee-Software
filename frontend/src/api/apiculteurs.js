import http from './client';

export const getApiculteurs   = ()           => http.get('/api/apiculteurs').then(r => r.data);
export const getApiculteur    = (id)         => http.get(`/api/apiculteurs/${id}`).then(r => r.data);
export const createApiculteur = (data)       => http.post('/api/apiculteurs', data).then(r => r.data);
export const updateApiculteur = (id, data)   => http.patch(`/api/apiculteurs/${id}`, data).then(r => r.data);
export const deleteApiculteur = (id)         => http.delete(`/api/apiculteurs/${id}`);

// Scoped to one apiculteur's data
export const getApiculteurHives         = (id) => http.get(`/api/apiculteurs/${id}/hives`).then(r => r.data);
export const getApiculteurNotifications = (id) => http.get(`/api/apiculteurs/${id}/notifications`).then(r => r.data);