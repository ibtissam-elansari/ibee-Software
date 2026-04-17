import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import useAuthStore from '../store/useAuthStore';

export const userKeys = {
  all : ['users'],
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

export function useUserList() {
  return useQuery({
    queryKey : userKeys.all,
    queryFn  : authApi.getUsers,
    staleTime: 30_000,
  });
}

// ── Role selector — handles multiple store shapes ─────────────────────────────
// Login response: { access_token, role, user_id, email }
// Common store patterns: s.role | s.user.role | s.auth.role

export function useCurrentUserRole() {
  return useAuthStore(s =>
    s.user?.role ?? s.role ?? s.auth?.role ?? null
  );
}

export function useCurrentUser() {
  return useAuthStore(s => s.user ?? { role: s.role, email: s.email } ?? null);
}

// ── Permission helpers (mirrors backend _can_manage_target) ───────────────────

export function canManage(actorRole, targetRole) {
  if (!actorRole) return false;
  if (actorRole === 'superuser') return true;
  if (actorRole === 'admin')     return targetRole === 'user' || targetRole === 'admin';
  return false;
}

export function assignableRoles(actorRole) {
  if (actorRole === 'superuser') return ['user', 'admin', 'superuser'];
  if (actorRole === 'admin')     return ['user', 'admin'];
  return [];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.createUser,
    onSuccess : () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => authApi.updateUser(id, data),
    onSuccess : () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => authApi.deleteUser(id),
    onSuccess : () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}