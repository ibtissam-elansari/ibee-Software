// pages/Gestion/hooks/useGestionHives.js
//
// Manages hive CRUD for a specific apiculteur.
// Fetches from /api/apiculteurs/:id/hives (scoped endpoint)
// and writes via /api/hives/* (standard CRUD).

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiculteurHives }          from '../../../api/apiculteurs';
import { createHive, updateHive, deleteHive } from '../../../api/hives';

export function useGestionHives(apiculteurId) {
  const qc = useQueryClient();

  // ── Fetch hives scoped to this apiculteur ─────────────────────────────────
  const { data: hives = [], isLoading } = useQuery({
    queryKey    : ['apiculteur-hives', apiculteurId],
    queryFn     : () => getApiculteurHives(apiculteurId),
    enabled     : !!apiculteurId,
    staleTime   : 15_000,
    refetchInterval: 60_000,
  });

  // ── Modal state ───────────────────────────────────────────────────────────
  // modal: null | { type: 'create' } | { type: 'settings', hive } | { type: 'delete', hive }
  const [modal, setModal] = useState(null);

  const openCreate   = ()     => setModal({ type: 'create' });
  const openSettings = (hive) => setModal({ type: 'settings', hive });
  const openDelete   = (hive) => setModal({ type: 'delete',   hive });
  const closeModal   = ()     => setModal(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['apiculteur-hives', apiculteurId] });
    qc.invalidateQueries({ queryKey: ['hives'] });
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => createHive({ ...data, apiculteur_id: apiculteurId }),
    onSuccess : () => { invalidate(); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateHive(id, data),
    onSuccess : () => { invalidate(); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteHive(id),
    onSuccess : () => { invalidate(); closeModal(); },
  });

  const handleCreate = (data)       => createMutation.mutate(data);
  const handleUpdate = (id, data)   => updateMutation.mutate({ id, data });
  const handleDelete = (id)         => deleteMutation.mutate(id);

  return {
    hives,
    isLoading,
    modal,
    openCreate,
    openSettings,
    openDelete,
    closeModal,
    handleCreate,
    handleUpdate,
    handleDelete,
    creating : createMutation.isPending,
    updating : updateMutation.isPending,
    deleting : deleteMutation.isPending,
  };
}