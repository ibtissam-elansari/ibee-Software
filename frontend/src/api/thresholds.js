import client from './client';
 
// src/api/thresholds.js — add /api prefix to all paths
export const getThresholdProfiles = (apiculteurId) =>
  client.get(`/api/apiculteurs/${apiculteurId}/threshold-profiles`).then((r) => r.data)

export const createThresholdProfile = (apiculteurId, data) =>
  client.post(`/api/apiculteurs/${apiculteurId}/threshold-profiles`, data).then((r) => r.data)

export const updateThresholdProfile = (id, data) =>
  client.put(`/api/threshold-profiles/${id}`, data).then((r) => r.data)

export const deleteThresholdProfile = (id) =>
  client.delete(`/api/threshold-profiles/${id}`).then((r) => r.data)

export const assignProfile = (profileId, hiveIds) =>
  client.post(`/api/threshold-profiles/${profileId}/assign`, { hive_ids: hiveIds }).then((r) => r.data)

export const unassignProfile = (profileId, hiveIds) =>
  client.delete(`/api/threshold-profiles/${profileId}/assign`, { data: { hive_ids: hiveIds } }).then((r) => r.data)