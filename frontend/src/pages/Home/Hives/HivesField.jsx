import React, { useState, useMemo } from 'react'
import { Search, List, LayoutGrid, Plus } from 'lucide-react'
import { useHiveList } from '../../../hooks/useHives'
import HiveRow   from './components/HiveRow'
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
]

const FILTER_OPTIONS = ['Toutes', 'Urgente', 'Attention', 'Normale']

const HivesField = () => {
  const { data: hives = [], isLoading, isError, dataUpdatedAt } = useHiveList()

  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState('Toutes')
  const [view,         setView]         = useState('list')
  const [selectedHive, setSelectedHive] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return hives.filter(h => {
      const name = (h.name ?? '').toLowerCase()
      return q === '' || name.includes(q)
    })
  }, [hives, search])

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit',
      })
    : null

  if (isError) {
    return (
      <div className="rounded-box border border-error/30 bg-error/5 p-6 text-sm text-error">
        Impossible de charger les ruches.
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* ── Heading + Add button ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-base-content">Les ruches</h2>
        </div>

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
          <div className="flex items-center gap-1">
            {[
              { id: 'list', Icon: List },
              { id: 'grid', Icon: LayoutGrid },
            ].map(({ id, Icon }) => (
              <button
                key={id}
                className={`btn btn-sm btn-ghost p-2 border rounded-lg
                  ${view === id ? 'bg-base-200 border-base-300' : 'border-transparent'}`}
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
        <div className="rounded-2xl bg-base-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className='bg-[#fffcf6]'>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-xs font-light uppercase tracking-wider text-base-content/40"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
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
                    <td
                      colSpan={COLUMNS.length}
                      className="px-4 py-10 text-center text-sm text-base-content/40"
                    >
                      {search
                        ? `Aucune ruche trouvée pour "${search}"`
                        : 'Aucune ruche enregistrée.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(hive => (
                    <HiveRow
                      key={hive.id}
                      hive={hive}
                      onClick={() => setSelectedHive(hive)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className="flex items-center gap-2 text-xs text-base-content/40 pb-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span>
            Surveillance en direct
            {lastUpdate ? ` • Dernière mise à jour : ${lastUpdate}` : ''}
          </span>
        </div>
      </div>

      {/* ── Hive detail modal ── */}
      {selectedHive && (
        <HiveModal
          hive={selectedHive}
          onClose={() => setSelectedHive(null)}
        />
      )}
    </>
  )
}

export default HivesField