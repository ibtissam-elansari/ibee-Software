// GestionPage.jsx
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useGestionHives } from './hooks/useGestionHives';

import HiveCard from './components/HiveCard';
import AddHiveCard from './components/AddHiveCard';
import GestionHiveModal from './components/GestionHiveModal';
import useAuthStore from '../../store/useAuthStore';

const GestionPage = () => {
  const { apiculteurId } = useParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');

  const {
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
    creating,
    updating,
    deleting,
  } = useGestionHives(Number(apiculteurId));

  const handleHiveClick = (hive) => {
    navigate(`/apiculteurs/${apiculteurId}/gestion/${hive.id}`);
  };

  const filteredHives = useMemo(() => {
    return hives.filter((hive) =>
      hive.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [hives, search]);

  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-4 sm:p-6 min-h-full bg-white">

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6 mt-2 sm:mt-4 flex justify-start">
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Chercher une ruche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-4 pr-9 rounded-2xl border border-gray-200 bg-white
                      text-sm text-gray-700 placeholder:text-gray-300
                      focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* Hive Grid — 2 cols on mobile, 3 on sm, 4 on md, 5 on lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">

        {user?.role === 'superuser' && <AddHiveCard onClick={openCreate} />}

        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-44 sm:h-48 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))
          : filteredHives.map((hive) => (
              <HiveCard
                key={hive.id}
                hive={hive}
                onClick={() => handleHiveClick(hive)}
                onSettings={() => openSettings(hive)}
                onDelete={() => openDelete(hive)}
              />
            ))}
      </div>

      {modal !== null && (
        <GestionHiveModal
          modal={modal}
          onClose={closeModal}
          onCreate={handleCreate}
          onUpdate={(hive, data) => handleUpdate(hive.id, data)}
          onDelete={(hive) => handleDelete(hive.id)}
          creating={creating}
          updating={updating}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default GestionPage;