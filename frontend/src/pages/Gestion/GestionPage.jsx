import React from 'react';
import { useHivesField } from '../Home/Hives/hooks/useHivesField';
import { useGestionHives } from './hooks/useGestionHives';

import HiveCard from './components/HiveCard';
import AddHiveCard from './components/AddHiveCard';
import GestionHiveModal from './components/GestionHiveModal';

const GestionPage = () => {
  const { hives, isLoading } = useHivesField();

  const {
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
  } = useGestionHives();

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <AddHiveCard onClick={openCreate} />

        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            ))
          : hives.map((hive) => (
              <HiveCard
                key={hive.id}
                hive={hive}
                onSettings={() => openSettings(hive)}
                onDelete={() => openDelete(hive)}
              />
            ))}
      </div>

      <GestionHiveModal
        modal={modal}
        onClose={closeModal}
        onCreate={handleCreate}
        onToggle={handleToggle}
        onDelete={handleDelete}
        creating={creating}
        updating={updating}
        deleting={deleting}
      />
    </div>
  );
};

export default GestionPage;