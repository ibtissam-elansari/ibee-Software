import { useState } from 'react'
import { useCreateHive, useUpdateHive, useDeleteHive } from '../../../hooks/useHives'

export function useGestionHives() {
  const [modal, setModal] = useState({ type: null, hive: null })

  const { mutate: createHive, isPending: creating } = useCreateHive()
  const { mutate: updateHive, isPending: updating } = useUpdateHive()
  const { mutate: deleteHive, isPending: deleting } = useDeleteHive()

  const openCreate   = ()     => setModal({ type: 'create',   hive: null })
  const openSettings = (hive) => setModal({ type: 'settings', hive })
  const openDelete   = (hive) => setModal({ type: 'delete',   hive })
  const closeModal   = ()     => setModal({ type: null, hive: null })

  const handleCreate = (data) =>
    createHive(data, { onSuccess: closeModal })

  const handleUpdate = (hive, data) =>
    updateHive({ id: hive.id, data }, { onSuccess: closeModal })

  const handleDelete = (hive) =>
    deleteHive(hive.id, { onSuccess: closeModal })

  return {
    modal,
    openCreate, openSettings, openDelete, closeModal,
    handleCreate, handleUpdate, handleDelete,
    creating, updating, deleting,
  }
}