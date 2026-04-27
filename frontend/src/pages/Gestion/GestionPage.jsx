import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGestionHives } from './hooks/useGestionHives';

import HiveCard        from './components/HiveCard';
import AddHiveCard     from './components/AddHiveCard';
import GestionHiveModal from './components/GestionHiveModal';

const GestionPage = () => {
  const { apiculteurId } = useParams();
  const navigate         = useNavigate();

  const {
    hives, isLoading,
    modal, openCreate, openSettings, openDelete, closeModal,
    handleCreate, handleUpdate, handleDelete,
    creating, updating, deleting,
  } = useGestionHives(Number(apiculteurId));

  const handleHiveClick = (hive) => {
    // Navigate to HiveAnalyticsPage — always scoped
    navigate(`/apiculteurs/${apiculteurId}/gestion/${hive.id}`);
  };

  return (
    <div className="p-6 min-h-full bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <AddHiveCard onClick={openCreate} />

        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            ))
          : hives.map((hive) => (
              <HiveCard
                key         = {hive.id}
                hive        = {hive}
                onClick     = {() => handleHiveClick(hive)}
                onSettings  = {() => openSettings(hive)}
                onDelete    = {() => openDelete(hive)}
              />
            ))}
      </div>

      {modal !== null && (
        <GestionHiveModal
          modal    = {modal}
          onClose  = {closeModal}
          onCreate = {handleCreate}
          onUpdate = {(hive, data) => handleUpdate(hive.id, data)}
          onDelete = {(hive) => handleDelete(hive.id)}
          creating = {creating}
          updating = {updating}
          deleting = {deleting}
        />
      )}
    </div>
  );
};

export default GestionPage;