import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/apiculteurs';

const KEY = ['apiculteurs'];
const scopedKey = (id) => ['apiculteur', id];

// ── Queries ───────────────────────────────────────────────────────────────────

export function useApiculteurList() {
  return useQuery({ queryKey: KEY, queryFn: api.getApiculteurs, staleTime: 30_000 });
}

export function useApiculteur(id) {
  return useQuery({
    queryKey: scopedKey(id),
    queryFn : () => api.getApiculteur(id),
    enabled : !!id,
    staleTime: 30_000,
  });
}

export function useApiculteurHives(id) {
  return useQuery({
    queryKey: ['apiculteur-hives', id],
    queryFn : () => api.getApiculteurHives(id),
    enabled : !!id,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useApiculteurNotifications(id) {
  return useQuery({
    queryKey: ['apiculteur-notifications', id],
    queryFn : () => api.getApiculteurNotifications(id),
    enabled : !!id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateApiculteur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createApiculteur,
    onSuccess : () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateApiculteur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateApiculteur(id, data),
    onSuccess : () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteApiculteur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteApiculteur,
    onSuccess : () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// ── Page state hook ───────────────────────────────────────────────────────────

export function useApiculteursPage() {
  const { data: apiculteurs = [], isLoading, isError } = useApiculteurList();
  const createMutation = useCreateApiculteur();
  const updateMutation = useUpdateApiculteur();
  const deleteMutation = useDeleteApiculteur();

  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState(null); // 'add' | 'edit' | 'delete'
  const [target, setTarget] = useState(null);

  const openAdd    = ()  => { setTarget(null); setModal('add');    };
  const openEdit   = (a) => { setTarget(a);    setModal('edit');   };
  const openDelete = (a) => { setTarget(a);    setModal('delete'); };
  const close      = ()  => { setModal(null);  setTarget(null);    };

  const submitAdd    = (data) => createMutation.mutate(data, { onSuccess: close });
  const submitEdit   = (data) => updateMutation.mutate({ id: target.id, data }, { onSuccess: close });
  const submitDelete = ()     => deleteMutation.mutate(target.id, { onSuccess: close });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apiculteurs.filter(a =>
      !q || a.company_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    );
  }, [apiculteurs, search]);

  return {
    filtered, isLoading, isError,
    search, setSearch,
    modal, target,
    openAdd, openEdit, openDelete, close,
    submitAdd, submitEdit, submitDelete,
    isSubmittingAdd   : createMutation.isPending,
    isSubmittingEdit  : updateMutation.isPending,
    isSubmittingDelete: deleteMutation.isPending,
    addError          : createMutation.error,
    editError         : updateMutation.error,
    deleteError       : deleteMutation.error,
  };
}