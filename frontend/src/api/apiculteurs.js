import http from './client';

export const getApiculteurs  = ()           => http.get('/api/apiculteurs').then(r => r.data);
export const createApiculteur= (data)       => http.post('/api/apiculteurs', data).then(r => r.data);
export const updateApiculteur= (id, data)   => http.patch(`/api/apiculteurs/${id}`, data).then(r => r.data);
export const deleteApiculteur= (id)         => http.delete(`/api/apiculteurs/${id}`);