// pages/Apiculteurs/ApiculteursPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle }  from 'lucide-react';
import { useApiculteursPage } from '../../hooks/useApiculteurs';
import useScopeStore          from '../../store/useScopeStore';
import ApiculteurCard         from './components/ApiculteurCard';
import ApiculteurFormModal    from './components/ApiculteurFormModal';
import DeleteApiculteurModal  from './components/DeleteApiculteurModal';

const ApiculteursPage = () => {
  const navigate            = useNavigate();
  const setScopedApiculteur = useScopeStore((s) => s.setScopedApiculteur);

  const {
    filtered,
    isLoading,
    search, setSearch,
    modal, target,
    openAdd, openEdit, openDelete, close,
    submitAdd, submitEdit, submitDelete,
    isSubmittingAdd, isSubmittingEdit, isSubmittingDelete,
  } = useApiculteursPage();

  const handleViewDashboard = (apiculteur) => {
    setScopedApiculteur({ id: apiculteur.id, company_name: apiculteur.company_name });
    navigate(`/apiculteurs/${apiculteur.id}/dashboard`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Apiculteurs</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestion des clients, surveiller la santé de leurs ruches
          </p>
        </div>
        <button
          onClick   = {openAdd}
          className = "flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <PlusCircle size={16} />
          Ajouter un Apiculteur
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <input
            type        = "text"
            placeholder = "Nom / email..."
            value       = {search}
            onChange    = {(e) => setSearch(e.target.value)}
            className   = "w-full pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          />
        </div>
        <span className="text-sm text-gray-400">
          {filtered.length} Apiculteur{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((apiculteur) => (
            <ApiculteurCard
              key             = {apiculteur.id}
              apiculteur      = {apiculteur}
              onViewDashboard = {() => handleViewDashboard(apiculteur)}
              onEdit          = {() => openEdit(apiculteur)}
              onDelete        = {() => openDelete(apiculteur)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <ApiculteurFormModal
          apiculteur  = {modal === 'edit' ? target : null}
          onClose     = {close}
          onSubmit    = {modal === 'add' ? submitAdd : submitEdit}
          isSubmitting= {modal === 'add' ? isSubmittingAdd : isSubmittingEdit}
        />
      )}

      {/* Delete confirm modal */}
      {modal === 'delete' && (
        <DeleteApiculteurModal
          apiculteur  = {target}
          onClose     = {close}
          onConfirm   = {submitDelete}
          isSubmitting= {isSubmittingDelete}
        />
      )}
    </div>
  );
};

export default ApiculteursPage;