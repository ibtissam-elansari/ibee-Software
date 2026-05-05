// src/pages/Gestion/hooks/useThresholdProfiles.js

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getThresholdProfiles,
  createThresholdProfile,
  updateThresholdProfile,
  deleteThresholdProfile,
  assignProfile,
  unassignProfile,
} from '../../../api/thresholds';

export function useThresholdProfiles(apiculteurId) {
  const qc = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey : ['threshold-profiles', apiculteurId],
    queryFn  : () => getThresholdProfiles(apiculteurId),
    enabled  : !!apiculteurId,
    staleTime: 30_000,
  });

  // modal: null | { type: 'create' } | { type: 'edit', profile } | { type: 'delete', profile }
  const [modal, setModal] = useState(null);
  const openCreate = ()        => setModal({ type: 'create' });
  const openEdit   = (profile) => setModal({ type: 'edit',   profile });
  const openDelete = (profile) => setModal({ type: 'delete', profile });
  const closeModal = ()        => setModal(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['threshold-profiles',  apiculteurId] });
    // Re-fetch hives so threshold_profile_id badges update
    qc.invalidateQueries({ queryKey: ['apiculteur-hives',    apiculteurId] });
  };

  const createMutation = useMutation({
    mutationFn: (data)       => createThresholdProfile(apiculteurId, data),
    onSuccess : ()           => { invalidate(); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateThresholdProfile(id, data),
    onSuccess : ()             => { invalidate(); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteThresholdProfile(id),
    onSuccess : ()   => { invalidate(); closeModal(); },
  });

  const assignMutation = useMutation({
    mutationFn: ({ profileId, hiveIds }) => assignProfile(profileId, hiveIds),
    onSuccess : () => invalidate(),
  });

  const unassignMutation = useMutation({
    mutationFn: ({ profileId, hiveIds }) => unassignProfile(profileId, hiveIds),
    onSuccess : () => invalidate(),
  });

  return {
    profiles,
    isLoading,
    modal,
    openCreate,
    openEdit,
    openDelete,
    closeModal,
    handleCreate   : (data)              => createMutation.mutate(data),
    handleUpdate   : (id, data)          => updateMutation.mutate({ id, data }),
    handleDelete   : (id)                => deleteMutation.mutate(id),
    handleAssign   : (profileId, hiveIds) => assignMutation.mutate({ profileId, hiveIds }),
    handleUnassign : (profileId, hiveIds) => unassignMutation.mutate({ profileId, hiveIds }),
    creating  : createMutation.isPending,
    updating  : updateMutation.isPending,
    deleting  : deleteMutation.isPending,
    assigning : assignMutation.isPending || unassignMutation.isPending,
  };
}