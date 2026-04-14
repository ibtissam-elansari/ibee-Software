import { useState } from 'react';
import {
  useCreateHive,
  useUpdateHive,
  useDeleteHive,
} from '../../../../hooks/useHives';

export function useGestionHives() {
  const [modal, setModal] = useState({
    type: null, // 'create' | 'settings' | 'delete'
    hive: null,
  });

  const { mutate: createHive, isPending: creating } = useCreateHive();
  const { mutate: updateHive, isPending: updating } = useUpdateHive();
  const { mutate: deleteHive, isPending: deleting } = useDeleteHive();

  // ── OPENERS ─────────────────────────
  const openCreate = () => setModal({ type: 'create', hive: null });
  const openSettings = (hive) => setModal({ type: 'settings', hive });
  const openDelete = (hive) => setModal({ type: 'delete', hive });

  const closeModal = () => setModal({ type: null, hive: null });

  // ── ACTIONS ─────────────────────────

  const handleCreate = (data) => {
    createHive(data, {
      onSuccess: closeModal,
    });
  };

  const handleToggle = (hive, value) => {
    updateHive({
      id: hive.id,
      data: { is_active: value },
    });
  };

  const handleDelete = (hive) => {
    deleteHive(hive.id, {
      onSuccess: closeModal,
    });
  };

  return {
    modal,
    openCreate,
    openSettings,
    openDelete,
    closeModal,

    handleCreate,
    handleToggle,
    handleDelete,

    creating,
    updating,
    deleting,
  };
}