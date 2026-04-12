import React, { useState, useMemo } from 'react';
import { Search, List, LayoutGrid, BarChart2, Plus } from 'lucide-react';
import { useHiveList } from '../../../hooks/useHives';
import HiveRow from './components/HiveRow';

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

const HivesField = ({ onHiveClick, onAddHive }) => {
  const { data: hives = [], isLoading, isError, dataUpdatedAt } = useHiveList();

  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('Toutes');
  const [view,    setView]    = useState('list'); // 'list' | 'grid' | 'chart'

  // Client-side search on hive name
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hives.filter(h => {
      const name = (h.name ?? h.dev_eui ?? '').toLowerCase();
      return q === '' || name.includes(q);
    });
  }, [hives, search]);

  // Format last update
  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  if (isError) {
    return (
      <div className="rounded-box border border-error/30 bg-error/5 p-6 text-sm text-error">
        Impossible de charger les ruches. Vérifiez que le backend est accessible.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Section heading ── */}
      <h2 className="text-2xl font-bold text-base-content">Les ruches</h2>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Cherche"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input input-bordered input-sm w-full pl-9 bg-base-100"
          />
        </div>

        {/* View toggle */}
        <div className="join border border-base-300 rounded-lg overflow-hidden">
          {[
            { id: 'list',  Icon: List },
            { id: 'grid',  Icon: LayoutGrid },
            { id: 'chart', Icon: BarChart2  },
          ].map(({ id, Icon }) => (
            <button
              key={id}
              className={`join-item btn btn-sm btn-ghost px-3
                ${view === id ? 'bg-base-200' : ''}`}
              onClick={() => setView(id)}
              aria-label={id}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Filter dropdown */}
        <select
          className="select select-bordered select-sm bg-base-100"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          {FILTER_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        
      </div>

      {/* ── Table ── */}
      <div className="rounded-box border border-base-200 bg-base-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">

            {/* Header */}
            <thead>
              <tr className="border-b border-base-200 bg-base-100">
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-base-content/50"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-base-200">
                    {COLUMNS.map(col => (
                      <td key={col.key} className="px-4 py-4">
                        <div className="skeleton h-4 w-16 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-base-content/40">
                    {search ? `Aucune ruche trouvée pour "${search}"` : 'Aucune ruche enregistrée.'}
                  </td>
                </tr>
              ) : (
                filtered.map(hive => (
                  <HiveRow
                    key={hive.id}
                    hive={hive}
                    onClick={onHiveClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center gap-2 text-xs text-base-content/50 pb-1">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
        <span>
          Surveillance en direct
          {lastUpdate ? ` • Dernière mise à jour : ${lastUpdate}` : ''}
        </span>
      </div>
    </div>
  );
};

export default HivesField;