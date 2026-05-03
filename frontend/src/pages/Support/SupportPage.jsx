// src/pages/Support/SupportPage.jsx
import React, { useState } from 'react';
import { Plus, ChevronRight, Clock, CheckCircle2, AlertCircle,
         Loader2, X, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useCreateTicket, useTickets, useUpdateTicket, useDeleteTicket } from '../../hooks/useSupport';
import {
  TICKET_TYPES, TICKET_PRIORITIES,
  getStatusStyle, getPriorityStyle, getTypeInfo, formatDate,
} from './config/ticketConfig';

const StatusBadge = ({ status }) => {
  const s = getStatusStyle(status);
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>;
};

// ── Ticket detail drawer ──────────────────────────────────────────────────────
const TicketDrawer = ({ ticket, onClose, onEdit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket();
  const type = getTypeInfo(ticket.type);
  const canEdit = ticket.status === 'ouvert';

  const handleDelete = () => {
    deleteTicket(ticket.id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{type.icon}</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{type.label}</span>
            </div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">{ticket.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityStyle(ticket.priority).color}`}>
              {getPriorityStyle(ticket.priority).label}
            </span>
          </div>

          <p className="text-xs text-gray-400">Créé le {formatDate(ticket.created_at)}</p>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Response from support */}
          {ticket.response && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Réponse du support
              </p>
              <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">{ticket.response}</p>
              {ticket.responded_at && (
                <p className="text-xs text-green-500 mt-2">{formatDate(ticket.responded_at)}</p>
              )}
            </div>
          )}

          {!ticket.response && ticket.status === 'ouvert' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Votre ticket est en attente de traitement. Vous serez notifié dès qu'une réponse est disponible.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions — only while ouvert */}
        {canEdit && (
          <div className="p-4 border-t border-gray-100 flex items-center gap-2">
            <button
              onClick={() => onEdit(ticket)}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border
                border-gray-200 text-sm text-gray-600 hover:border-amber-300 hover:text-amber-700
                hover:bg-amber-50 transition-colors font-medium"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center gap-2 h-9 px-4 rounded-xl border
                  border-gray-200 text-sm text-red-400 hover:border-red-200 hover:bg-red-50
                  transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-9 px-3 rounded-xl bg-red-500 text-white text-xs font-semibold
                    hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '…' : 'Supprimer'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-400
                    hover:text-gray-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Edit ticket form ──────────────────────────────────────────────────────────
const EditTicketForm = ({ ticket, onClose }) => {
  const { mutate, isPending } = useUpdateTicket();
  const [form, setForm] = useState({ title: ticket.title, description: ticket.description });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 5)       e.title = 'Minimum 5 caractères';
    if (form.description.trim().length < 10) e.description = 'Minimum 10 caractères';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    mutate({ id: ticket.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-gray-100">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h3 className="text-base font-bold text-gray-900">Modifier le ticket</h3>
        </div>

        <div className="flex-1 p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Titre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={`w-full h-9 px-3 rounded-lg border text-sm text-gray-700 bg-white
                placeholder:text-gray-300 focus:outline-none transition-colors
                ${errors.title ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={6}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm text-gray-700 bg-white
                placeholder:text-gray-300 focus:outline-none resize-none transition-colors
                ${errors.description ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-500
              hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white
              text-sm font-semibold transition-colors flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</> : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Create ticket form ────────────────────────────────────────────────────────
const CreateTicketForm = ({ onClose }) => {
  const { mutate, isPending } = useCreateTicket();
  const [form, setForm] = useState({ title: '', description: '', type: 'assistance', priority: 'normale' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 5)       e.title = 'Minimum 5 caractères';
    if (form.description.trim().length < 10) e.description = 'Minimum 10 caractères';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    mutate(form, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-center gap-3 p-6 border-b border-gray-100">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
          <h3 className="text-base font-bold text-gray-900">Nouveau ticket</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Type de demande
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TICKET_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all
                    ${form.type === t.value ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="text-lg leading-none mt-0.5">{t.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold ${form.type === t.value ? 'text-amber-800' : 'text-gray-700'}`}>
                      {t.label}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Priorité
            </label>
            <div className="flex gap-2 flex-wrap">
              {TICKET_PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                    ${form.priority === p.value ? p.color : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Titre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Résumez votre problème en une phrase"
              className={`w-full h-9 px-3 rounded-lg border text-sm text-gray-700 bg-white
                placeholder:text-gray-300 focus:outline-none transition-colors
                ${errors.title ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez le problème en détail…"
              rows={5}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm text-gray-700 bg-white
                placeholder:text-gray-300 focus:outline-none resize-none transition-colors
                ${errors.description ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-500
              hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white
              text-sm font-semibold transition-colors flex items-center justify-center gap-2
              disabled:opacity-50"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Ticket row ────────────────────────────────────────────────────────────────
const TicketRow = ({ ticket, onClick }) => {
  const type = getTypeInfo(ticket.type);
  return (
    <button
      onClick={() => onClick(ticket)}
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-100
        hover:border-amber-200 hover:bg-amber-50/40 transition-all text-left group"
    >
      <span className="text-xl flex-shrink-0">{type.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{ticket.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(ticket.created_at)}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={ticket.status} />
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-400 transition-colors" />
      </div>
    </button>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const SupportPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [editing, setEditing]       = useState(null);

  const { data: tickets = [], isLoading } = useTickets();

  const openCount    = tickets.filter(t => t.status === 'ouvert').length;
  const pendingCount = tickets.filter(t => t.status === 'en_cours').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolu').length;

  const handleEdit = (ticket) => {
    setSelected(null);
    setEditing(ticket);
  };

  return (
    <>
      <div className="flex flex-col gap-5 p-2 px-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Support</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {tickets.length === 0
                ? 'Aucune demande envoyée'
                : `${tickets.length} demande${tickets.length > 1 ? 's' : ''} · ${openCount} ouverte${openCount > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600
              text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nouveau ticket
          </button>
        </div>

        {/* Stats */}
        {tickets.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Ouverts',  value: openCount,    icon: <AlertCircle className="w-4 h-4 text-blue-400" />   },
              { label: 'En cours', value: pendingCount,  icon: <Loader2 className="w-4 h-4 text-amber-400" />     },
              { label: 'Résolus',  value: resolvedCount, icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                {stat.icon}
                <div>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">Mes demandes</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-50 animate-pulse" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm text-gray-400">Vous n'avez aucun ticket pour le moment.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-amber-500 font-semibold hover:underline"
              >
                Créer votre première demande
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {tickets.map(ticket => (
                <TicketRow key={ticket.id} ticket={ticket} onClick={setSelected} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate  && <CreateTicketForm onClose={() => setShowCreate(false)} />}
      {selected    && <TicketDrawer ticket={selected} onClose={() => setSelected(null)} onEdit={handleEdit} />}
      {editing     && <EditTicketForm ticket={editing} onClose={() => setEditing(null)} />}
    </>
  );
};

export default SupportPage;