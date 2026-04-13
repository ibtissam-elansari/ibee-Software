import React from 'react';
import { Search, List, LayoutGrid, Plus } from 'lucide-react';
import { useHivesField } from './hooks/useHivesField';
import HiveRow from './components/HiveRow';
import HiveModal from './components/HiveModal'

const COLUMNS = [
  { key: 'name',        label: 'Ruche ID'    },
  { key: 'etat',        label: 'Etat'        },
  { key: 'batterie',    label: 'Batterie'    },
  { key: 'sonore',      label: 'Sonore'      },
  { key: 'humidite',    label: 'Humidité'    },
  { key: 'temperature', label: 'Température' },
  { key: 'signal',      label: 'Signal'      },
  { key: 'securite',    label: 'Sécurité'   },
];

const FILTER_OPTIONS = ['Toutes', 'Urgente', 'Attention', 'Normale'];

/**
 * HivesField — purely presentational.
 *
 * Zero business logic. All state and derivations live in useHivesField.
 * To change behaviour, edit the hook. To change appearance, edit this file.
 */
const HivesField = () => {
  const {
    filtered,
    isLoading,
    isError,
    search,        setSearch,
    filter,        setFilter,
    view,          setView,
    selectedHive,
    openHiveModal,
    closeHiveModal,
    addModalOpen,
    openAddModal,
    closeAddModal,
    lastUpdateLabel,
  } = useHivesField();

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Impossible de charger les ruches. Vérifiez que le backend est accessible.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900">Les ruches</h2>

        {/* Toolbar */}

        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* LEFT SIDE */}

          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="Cherche"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-gray-200 bg-white
                        text-sm text-gray-700 placeholder:text-gray-300
                        focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
              {[
                { id: 'list', Icon: List },
                { id: 'grid', Icon: LayoutGrid },
              ].map(({ id, Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`px-3 h-8 flex items-center justify-center transition-colors
                    ${view === id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <Icon className="w-4 h-4 text-gray-500" />
                </button>
              ))}
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white
                        text-sm text-gray-600 focus:outline-none focus:border-gray-400 cursor-pointer"
            >
              {FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

          {/* <button
            onClick={openAddModal}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-white text-sm
                       font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
            style={{ backgroundColor: '#F5A623' }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Ajouter une ruche
          </button> */}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-2.5 text-left border-b border-gray-200
                               text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {COLUMNS.map(col => (
                      <td key={col.key} className="px-4 py-4">
                        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-sm text-gray-400">
                    {search
                      ? `Aucune ruche trouvée pour "${search}"`
                      : 'Aucune ruche enregistrée.'}
                  </td>
                </tr>
              ) : (
                filtered.map(hive => (
                  <HiveRow key={hive.id} hive={hive} onClick={openHiveModal} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span>
            Surveillance en direct
            {lastUpdateLabel ? ` • Dernière mise à jour : ${lastUpdateLabel}` : ''}
          </span>
        </div>
      </div>

      {/* Modals */}
      {selectedHive && (
        <HiveModal hive={selectedHive} onClose={closeHiveModal} />
      )}
      {/* <HiveModal open={addModalOpen} onClose={closeAddModal} /> */}
    </>
  );
};

export default HivesField;