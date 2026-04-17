import { useState } from 'react';
import {
  useUserList,
  useCurrentUserRole,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  canManage,
  assignableRoles,
} from '../../../hooks/useUsers';

export function useUsersPage() {
  const { data: users = [], isLoading, isError } = useUserList();
  const actorRole = useCurrentUserRole();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  // ── Modal state ─────────────────────────────────────────────────────────────
  // mode: null | 'create' | 'edit' | 'delete'
  const [modal, setModal]       = useState(null);
  const [targetUser, setTarget] = useState(null);

  const openCreate = ()       => { setTarget(null); setModal('create'); };
  const openEdit   = (user)   => { setTarget(user); setModal('edit');   };
  const openDelete = (user)   => { setTarget(user); setModal('delete'); };
  const closeModal = ()       => { setModal(null);  setTarget(null);    };

  // ── Submit create ────────────────────────────────────────────────────────────
  const submitCreate = (data) =>
    createMutation.mutate(data, { onSuccess: closeModal });

  // ── Submit edit ──────────────────────────────────────────────────────────────
  const submitEdit = (data) =>
    updateMutation.mutate(
      { id: targetUser.id, data },
      { onSuccess: closeModal }
    );

  // ── Submit delete ────────────────────────────────────────────────────────────
  const submitDelete = () =>
    deleteMutation.mutate(targetUser.id, { onSuccess: closeModal });

  // ── Derived permissions ─────────────────────────────────────────────────────
  const canCreate       = actorRole === 'admin' || actorRole === 'superuser';
  const canEditUser     = (user) => canManage(actorRole, user.role);
  const canDeleteUser   = (user) => canManage(actorRole, user.role);
  const allowedRoles    = assignableRoles(actorRole);

  return {
    users,
    isLoading,
    isError,
    actorRole,
    // Modal
    modal,
    targetUser,
    openCreate,
    openEdit,
    openDelete,
    closeModal,
    // Mutations
    submitCreate,
    submitEdit,
    submitDelete,
    isSubmitting: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    createError : createMutation.error,
    editError   : updateMutation.error,
    deleteError : deleteMutation.error,
    // Permissions
    canCreate,
    canEditUser,
    canDeleteUser,
    allowedRoles,
  };
}