// src/api/thresholds.js

import client from './client';

/** List all profiles for an apiculteur */
export const getThresholdProfiles = (apiculteurId) =>
  client.get(`/apiculteurs/${apiculteurId}/threshold-profiles`).then((r) => r.data);

/** Create a new profile */
export const createThresholdProfile = (apiculteurId, data) =>
  client.post(`/apiculteurs/${apiculteurId}/threshold-profiles`, data).then((r) => r.data);

/** Update an existing profile */
export const updateThresholdProfile = (id, data) =>
  client.put(`/threshold-profiles/${id}`, data).then((r) => r.data);

/** Delete a profile (detaches all assigned hives automatically) */
export const deleteThresholdProfile = (id) =>
  client.delete(`/threshold-profiles/${id}`).then((r) => r.data);

/** Assign a profile to one or more hive IDs */
export const assignProfile = (profileId, hiveIds) =>
  client.post(`/threshold-profiles/${profileId}/assign`, { hive_ids: hiveIds }).then((r) => r.data);

/** Remove a profile from one or more hive IDs */
export const unassignProfile = (profileId, hiveIds) =>
  client.delete(`/threshold-profiles/${profileId}/assign`, { data: { hive_ids: hiveIds } }).then((r) => r.data);