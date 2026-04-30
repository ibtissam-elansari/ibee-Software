// src/pages/Support/SupportDashboardPage.jsx
// Shown to: superuser only
// Features: all tickets, filters, respond modal, status management

import React, { useState } from 'react';
import {
  Search, Filter, ChevronRight, X, Loader2,
  CheckCircle2, Clock, AlertTriangle, MessageSquare,
} from 'lucide-react';
import { useTickets, useRespondToTicket, usePatchTicketStatus, useDeleteTicket } from '../../hooks/useSupport';
import {
  TICKET_TYPES, TICKET_PRIORITIES, TICKET_STATUSES,
  getStatusStyle, getPriorityStyle, getTypeInfo, formatDate,
} from './config/ticketConfig';

// ── Badges ────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = getStatusStyle(status);
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.color}`}>
      {s.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const p = getPriorityStyle(priority);
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${p.color}`}>
      {p.label}
    </span>
  );
};

// ── Respond modal ─────────────────────────────────────────────────────────────
const RespondModal = ({ ticket, onClose }) => {
  const { mutate: respond, isPending: isResponding } = useRespondToTicket();
  const { mutate: patchStatus, isPending: isPatching } = usePatchTicketStatus();
  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket();

  const [response, setResponse]   = useState(ticket.response ?? '');
  const [status, setStatus]       = useState(ticket.status);
  const [priority, setPriority]   = useState(ticket.priority);
  const [tab, setTab]             = useState('respond'); // 'respond' | 'status'
  const [confirmDelete, setConfirmDelete] = useState(false);

  const type = getTypeInfo(ticket.type);
  const isPending = isResponding || isPatching || isDeleting;

  const handleRespond = () => {
    respond({ id: ticket.id, data: { response, status, priority } }, {
      onSuccess: onClose,
    });
  };

  const handleStatusOnly = () => {
    patchStatus({ id: ticket.id, status }, { onSuccess: onClose });
  };

  const handleDelete = () => {
    deleteTicket(ticket.id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{type.icon}</span>
              <span className="text-xs text-gray-400 font-medium">#{ticket.id} · {type.label}</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">{ticket.title}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              {ticket.created_by && (
                <span className="text-xs text-gray-400">
                  par {ticket.created_by.prenom ?? ''} {ticket.created_by.nom ?? ticket.created_by.email}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

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
            {[
              { id: 'respond', label: 'Répondre' },
              { id: 'status',  label: 'Statut seulement' },
            ].map(t => (
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
              {/* Priority override */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Priorité
                </label>
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

              {/* Status for response */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Nouveau statut
                </label>
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

              {/* Response text */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Votre réponse
                </label>
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
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Changer le statut
                </label>
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
                {isPatching
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Mise à jour…</>
                  : 'Mettre à jour le statut'
                }
              </button>
            </>
          )}

          {/* Delete zone */}
          <div className="border-t border-gray-100 pt-4">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Supprimer ce ticket
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-red-600 font-medium">Confirmer la suppression ?</p>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5
                    rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '…' : 'Supprimer'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Ticket table row ──────────────────────────────────────────────────────────
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
            <p className="text-sm font-semibold text-gray-800 max-w-[200px] truncate">{ticket.title}</p>
            <p className="text-xs text-gray-400">{ticket.created_by?.email ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5"><StatusBadge status={ticket.status} /></td>
      <td className="px-4 py-3.5"><PriorityBadge priority={ticket.priority} /></td>
      <td className="px-4 py-3.5 text-xs text-gray-400">{formatDate(ticket.created_at)}</td>
      <td className="px-4 py-3.5">
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-400 transition-colors" />
      </td>
    </tr>
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
        { label: 'Ouverts',    value: counts.ouvert,   icon: <Clock className="w-4 h-4 text-blue-400" />,          bg: 'bg-blue-50'   },
        { label: 'En cours',   value: counts.en_cours, icon: <Loader2 className="w-4 h-4 text-amber-400" />,        bg: 'bg-amber-50'  },
        { label: 'Résolus',    value: counts.resolu,   icon: <CheckCircle2 className="w-4 h-4 text-green-400" />,   bg: 'bg-green-50'  },
        { label: 'Urgents',    value: counts.urgente,  icon: <AlertTriangle className="w-4 h-4 text-red-400" />,    bg: 'bg-red-50'    },
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

// ── Main dashboard ────────────────────────────────────────────────────────────
const SupportDashboardPage = () => {
  const [filters, setFilters]   = useState({});
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  const { data: tickets = [], isLoading } = useTickets(filters);

  const displayed = search
    ? tickets.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.created_by?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  const setFilter = (key, val) =>
    setFilters(f => val ? { ...f, [key]: val } : Object.fromEntries(Object.entries(f).filter(([k]) => k !== key)));

  return (
    <>
      <div className="flex flex-col gap-5 p-2 px-5">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tickets support</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {tickets.length} ticket{tickets.length > 1 ? 's' : ''} au total
          </p>
        </div>

        {/* Stats */}
        {!isLoading && <StatsStrip tickets={tickets} />}

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
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

          {/* Status filter */}
          <select
            value={filters.status ?? ''}
            onChange={e => setFilter('status', e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm
              text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            {TICKET_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Priority filter */}
          <select
            value={filters.priority ?? ''}
            onChange={e => setFilter('priority', e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm
              text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="">Toutes priorités</option>
            {TICKET_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {/* Type filter */}
          <select
            value={filters.type ?? ''}
            onChange={e => setFilter('type', e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm
              text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="">Tous les types</option>
            {TICKET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} {t.icon}</option>)}
          </select>

          {/* Clear filters */}
          {(Object.keys(filters).length > 0 || search) && (
            <button
              onClick={() => { setFilters({}); setSearch(''); }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200
                text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Ticket', 'Statut', 'Priorité', 'Créé le', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase
                    tracking-[0.12em] text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[1,2,3,4,5].map(j => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-400">
                    Aucun ticket trouvé
                  </td>
                </tr>
              ) : (
                displayed.map(ticket => (
                  <TicketTableRow key={ticket.id} ticket={ticket} onClick={setSelected} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Respond modal */}
      {selected && (
        <RespondModal ticket={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
};

export default SupportDashboardPage;