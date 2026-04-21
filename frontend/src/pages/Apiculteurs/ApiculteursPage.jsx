import React from 'react';
import { Search, Plus } from 'lucide-react';
import { useApiculteursPage } from '../../hooks/useApiculteurs'
import ApiculteurCard    from './components/ApiculteurCard';
import ApiculteurFormModal from './components/ApiculteurFormModal';

/**
 * ApiculteursPage — superuser-only page.
 * Route: /apiculteurs
 */
const ApiculteursPage = () => {
  const {
    filtered, isLoading, isError,
    search, setSearch,
    modal, target,
    openAdd, openEdit, close,
    submitAdd, submitEdit,
    isSubmitting, addError, editError,
  } = useApiculteursPage();

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          Impossible de charger les apiculteurs. Vérifiez vos permissions.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 p-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Apiculteurs</h1>
            <p className="text-sm text-gray-400 mt-1">
              Gestion des clients, surveiller la santé de leurs ruches
            </p>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="Nom / email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 border border-gray-200 rounded-xl
                         text-sm text-gray-700 placeholder:text-gray-300 bg-white
                         focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 h-10 px-5 rounded-xl text-white text-sm
                       font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{ backgroundColor: '#F5A623' }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Ajouter un Apiculteur
          </button>
        </div>

        {/* ── Count ── */}
        {!isLoading && (
          <p className="text-sm text-gray-400">
            {filtered.length} Apiculteur{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-sm">Aucun apiculteur trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(a => (
              <ApiculteurCard
                key={a.user_id}
                apiculteur={a}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <ApiculteurFormModal
          mode="add"
          onSubmit={submitAdd}
          onClose={close}
          isSubmitting={isSubmitting}
          error={addError}
        />
      )}
      {modal === 'edit' && (
        <ApiculteurFormModal
          mode="edit"
          initialData={target}
          onSubmit={submitEdit}
          onClose={close}
          isSubmitting={isSubmitting}
          error={editError}
        />
      )}
    </>
  );
};

export default ApiculteursPage;