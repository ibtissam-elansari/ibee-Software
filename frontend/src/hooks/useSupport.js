// src/hooks/useSupport.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTicket,
  deleteTicket,
  getTicket,
  getTickets,
  patchTicketStatus,
  respondToTicket,
  updateTicket,
} from '../api/support';

const TICKETS_KEY = 'support-tickets';

// ── Queries ──────────────────────────────────────────────────────────────────

export const useTickets = (filters = {}) =>
  useQuery({
    queryKey : [TICKETS_KEY, filters],
    queryFn  : () => getTickets(filters),
    staleTime: 30_000,
  });

export const useTicket = (id) =>
  useQuery({
    queryKey : [TICKETS_KEY, id],
    queryFn  : () => getTicket(id),
    enabled  : !!id,
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess : () => qc.invalidateQueries({ queryKey: [TICKETS_KEY] }),
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTicket(id, data),
    onSuccess : () => qc.invalidateQueries({ queryKey: [TICKETS_KEY] }),
  });
};

export const useRespondToTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => respondToTicket(id, data),
    onSuccess : () => qc.invalidateQueries({ queryKey: [TICKETS_KEY] }),
  });
};

export const usePatchTicketStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => patchTicketStatus(id, status),
    onSuccess : () => qc.invalidateQueries({ queryKey: [TICKETS_KEY] }),
  });
};

export const useDeleteTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTicket,
    onSuccess : () => qc.invalidateQueries({ queryKey: [TICKETS_KEY] }),
  });
};