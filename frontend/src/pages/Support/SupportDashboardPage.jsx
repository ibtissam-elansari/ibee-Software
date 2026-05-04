// src/pages/Support/SupportDashboardPage.jsx
import React, { useState, useMemo } from 'react';
import {
  Search, X, Loader2, CheckCircle2, Clock,
  AlertTriangle, MessageSquare, Building2, ChevronRight,
} from 'lucide-react';
import {
  useTickets, useRespondToTicket,
  usePatchTicketStatus, useDeleteTicket,
} from '../../hooks/useSupport';
import {
  TICKET_TYPES, TICKET_PRIORITIES, TICKET_STATUSES,
  getStatusStyle, getPriorityStyle, getTypeInfo, formatDate,
} from './config/ticketConfig';

// ── Badges ────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = getStatusStyle(status);
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>;
};
const PriorityBadge = ({ priority }) => {
  const p = getPriorityStyle(priority);
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${p.color}`}>{p.label}</span>;
};

// ── Respond / manage modal ────────────────────────────────────────────────────
const RespondModal = ({ ticket, onClose }) => {
  const { mutate: respond,     isPending: isResponding } = useRespondToTicket();
  const { mutate: patchStatus, isPending: isPatching   } = usePatchTicketStatus();
  const { mutate: deleteTicket, isPending: isDeleting  } = useDeleteTicket();

  const [response, setResponse]       = useState(ticket.response ?? '');
  const [status,   setStatus]         = useState(ticket.status);
  const [priority, setPriority]       = useState(ticket.priority);
  const [tab,      setTab]            = useState('respond');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const type      = getTypeInfo(ticket.type);
  const isPending = isResponding || isPatching || isDeleting;

  const handleRespond = () =>
    respond({ id: ticket.id, data: { response, status, priority } }, { onSuccess: onClose });

  const handleStatusOnly = () =>
    patchStatus({ id: ticket.id, status }, { onSuccess: onClose });

  const handleDelete = () =>
    deleteTicket(ticket.id, { onSuccess: onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{type.icon}</span>
              <span className="text-xs text-gray-400 font-medium">#{ticket.id} · {type.label}</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">{ticket.title}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge   status={ticket.status}     />
              <PriorityBadge priority={ticket.priority} />
              {ticket.created_by && (
                <span className="text-xs text-gray-400">par {ticket.created_by.email}</span>
              )}
              {ticket.apiculteur_id && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Building2 className="w-3 h-3" /> Coop #{ticket.apiculteur_id}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Original description */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-3">
              {ticket.description}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">{formatDate(ticket.created_at)}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {[{ id: 'respond', label: 'Répondre' }, { id: 'status', label: 'Statut seulement' }].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'respond' ? (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Priorité</label>
                <div className="flex gap-2 flex-wrap">
                  {TICKET_PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                        ${priority === p.value ? p.color : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Nouveau statut</label>
                <div className="flex gap-2 flex-wrap">
                  {TICKET_STATUSES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                        ${status === s.value ? s.color : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Votre réponse</label>
                <textarea
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  rows={4}
                  placeholder="Rédigez votre réponse à l'utilisateur…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700
                    bg-white placeholder:text-gray-300 focus:outline-none focus:border-gray-400
                    resize-none transition-colors"
                />
              </div>

              <button
                onClick={handleRespond}
                disabled={isPending || !response.trim()}
                className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white
                  text-sm font-semibold transition-colors flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResponding
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</>
                  : <><MessageSquare className="w-4 h-4" /> Envoyer la réponse</>
                }
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Changer le statut</label>
                <div className="grid grid-cols-2 gap-2">
                  {TICKET_STATUSES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all
                        ${status === s.value ? s.color : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleStatusOnly}
                disabled={isPending || status === ticket.status}
                className="w-full h-10 rounded-xl bg-gray-900 hover:bg-gray-700 text-white
                  text-sm font-semibold transition-colors flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPatching ? <><Loader2 className="w-4 h-4 animate-spin" /> Mise à jour…</> : 'Mettre à jour le statut'}
              </button>
            </>
          )}
        </div>

        {/* Footer — delete zone, separate and calm */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Supprimer ce ticket
            </button>
          ) : (
            <>
              <span className="text-xs text-red-500 font-medium">Supprimer définitivement ?</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="h-7 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white
                  text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isDeleting ? '…' : 'Confirmer'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Stats strip ───────────────────────────────────────────────────────────────
const StatsStrip = ({ tickets }) => {
  const counts = {
    ouvert  : tickets.filter(t => t.status === 'ouvert').length,
    en_cours: tickets.filter(t => t.status === 'en_cours').length,
    resolu  : tickets.filter(t => t.status === 'resolu').length,
    urgente : tickets.filter(t => t.priority === 'urgente').length,
  };
  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Ouverts',  value: counts.ouvert,   icon: <Clock        className="w-4 h-4 text-blue-400"  />, bg: 'bg-blue-50'  },
        { label: 'En cours', value: counts.en_cours,  icon: <Loader2      className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-50' },
        { label: 'Résolus',  value: counts.resolu,    icon: <CheckCircle2 className="w-4 h-4 text-green-400" />, bg: 'bg-green-50' },
        { label: 'Urgents',  value: counts.urgente,   icon: <AlertTriangle className="w-4 h-4 text-red-400" />, bg: 'bg-red-50'   },
      ].map(stat => (
        <div key={stat.label} className={`${stat.bg} rounded-xl border border-white/80 p-4 flex items-center gap-3`}>
          {stat.icon}
          <div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Ticket row ────────────────────────────────────────────────────────────────
const TicketTableRow = ({ ticket, onClick }) => {
  const type = getTypeInfo(ticket.type);
  return (
    <tr
      onClick={() => onClick(ticket)}
      className="border-b border-gray-50 hover:bg-amber-50/30 cursor-pointer transition-colors group"
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{type.icon}</span>
          <div>
            <p className="text-sm font-semibold text-gray-800 max-w-[180px] truncate">{ticket.title}</p>
            <p className="text-xs text-gray-400">{ticket.created_by?.email ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        {ticket.apiculteur_id
          ? <span className="flex items-center gap-1 text-xs text-gray-500">
              <Building2 className="w-3 h-3 text-gray-400" /> Coop #{ticket.apiculteur_id}
            </span>
          : <span className="text-xs text-gray-300">—</span>
        }
      </td>
      <td className="px-4 py-3.5"><StatusBadge   status={ticket.status}     /></td>
      <td className="px-4 py-3.5"><PriorityBadge priority={ticket.priority} /></td>
      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(ticket.created_at)}</td>
      <td className="px-4 py-3.5">
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-400 transition-colors" />
      </td>
    </tr>
  );
};

// ── Apiculteur group section ──────────────────────────────────────────────────
const ApiculteurGroup = ({ apiculteurId, tickets, onTicketClick }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 px-1 mb-2">
      <Building2 className="w-4 h-4 text-gray-400" />
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {apiculteurId === 'none' ? 'Sans coopérative' : `Coopérative #${apiculteurId}`}
      </h4>
      <span className="text-xs text-gray-400">· {tickets.length} ticket{tickets.length > 1 ? 's' : ''}</span>
    </div>
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <tbody>
          {tickets.map(ticket => (
            <TicketTableRow key={ticket.id} ticket={ticket} onClick={onTicketClick} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Main dashboard ────────────────────────────────────────────────────────────
const SupportDashboardPage = () => {
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [priority, setPriority] = useState('');
  const [type,     setType]     = useState('');
  const [groupByApiculteur, setGroupByApiculteur] = useState(true);
  const [selected, setSelected] = useState(null);

  // Build query params from non-empty filter values only
  const queryParams = useMemo(() => {
    const p = {};
    if (status)   p.status   = status;
    if (priority) p.priority = priority;
    if (type)     p.type     = type;
    return p;
  }, [status, priority, type]);

  const { data: tickets = [], isLoading } = useTickets(queryParams);

  // Client-side search filter (avoids extra API calls)
  const displayed = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.created_by?.email?.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  // Group by apiculteur_id
  const grouped = useMemo(() => {
    const map = {};
    displayed.forEach(t => {
      const key = t.apiculteur_id ?? 'none';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [displayed]);

  const hasFilters = search || status || priority || type;

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setType('');
  };

  return (
    <>
      <div className="flex flex-col gap-5 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tickets support</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {tickets.length} ticket{tickets.length > 1 ? 's' : ''} au total
            </p>
          </div>
          {/* Group toggle */}
          <button
            onClick={() => setGroupByApiculteur(v => !v)}
            className={`flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
              ${groupByApiculteur
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Par coopérative
          </button>
        </div>

        {/* Stats */}
        {!isLoading && <StatsStrip tickets={tickets} />}

        {/* Toolbar — all controlled state, no form submission */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-gray-200 bg-white
                text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none
                focus:border-gray-400 transition-colors"
            />
          </div>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm
              text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            {TICKET_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm
              text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="">Toutes priorités</option>
            {TICKET_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm
              text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="">Tous les types</option>
            {TICKET_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200
                text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-xl bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm text-gray-400">Aucun ticket trouvé</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-2 text-sm text-amber-500 hover:underline font-medium">
                Effacer les filtres
              </button>
            )}
          </div>
        ) : groupByApiculteur ? (
          // Grouped view
          <div>
            {Object.entries(grouped)
              .sort(([a], [b]) => (a === 'none' ? 1 : b === 'none' ? -1 : Number(a) - Number(b)))
              .map(([apiculteurId, groupTickets]) => (
                <ApiculteurGroup
                  key={apiculteurId}
                  apiculteurId={apiculteurId}
                  tickets={groupTickets}
                  onTicketClick={setSelected}
                />
              ))
            }
          </div>
        ) : (
          // Flat table view
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Ticket', 'Coopérative', 'Statut', 'Priorité', 'Créé le', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase
                      tracking-[0.12em] text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map(ticket => (
                  <TicketTableRow key={ticket.id} ticket={ticket} onClick={setSelected} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <RespondModal ticket={selected} onClose={() => setSelected(null)} />}
    </>
  );
};

export default SupportDashboardPage;