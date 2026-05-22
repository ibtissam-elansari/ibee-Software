// src/pages/Settings/components/PendingAccountsPanel.jsx
// Drop this inside AccountManagementPage so the superuser can see and
// approve/reject pending registrations.
import React, { useState } from 'react'
import { Clock, CheckCircle2, X, Building2, ChevronDown } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPendingUsers, approveUser, rejectUser } from '../../../api/auth'
import { useApiculteurList } from '../../../hooks/useApiculteurs'

const ApproveModal = ({ user, onClose }) => {
  const qc = useQueryClient()
  const { data: coops = [] } = useApiculteurList()
  const [coopId, setCoopId] = useState('')

  const { mutate: approve, isPending } = useMutation({
    mutationFn: () => approveUser(user.id, Number(coopId)),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['pending-users'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">Approuver le compte</h3>
        <p className="text-sm text-gray-400 mb-4">
          Choisissez la coopérative à associer à{' '}
          <span className="font-medium text-gray-700">{user.email}</span>
        </p>

        <div className="relative mb-5">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={coopId}
            onChange={e => setCoopId(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-gray-200 text-sm
                       text-gray-700 bg-white focus:outline-none focus:border-amber-400 transition-colors
                       appearance-none cursor-pointer"
          >
            <option value="">Sélectionner une coopérative…</option>
            {coops.map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-500
                       hover:bg-gray-50 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={() => approve()}
            disabled={!coopId || isPending}
            className="flex-1 h-10 rounded-xl bg-green-500 hover:bg-green-600 text-white
                       text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isPending ? 'Approbation…' : 'Approuver'}
          </button>
        </div>
      </div>
    </div>
  )
}

const PendingAccountsPanel = () => {
  const qc = useQueryClient()
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn : getPendingUsers,
    staleTime: 30_000,
  })

  const { mutate: reject } = useMutation({
    mutationFn: rejectUser,
    onSuccess : () => qc.invalidateQueries({ queryKey: ['pending-users'] }),
  })

  const [approving, setApproving] = useState(null) // user being approved

  if (isLoading) return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="h-5 w-48 bg-gray-100 rounded animate-pulse mb-4" />
      {[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-gray-50 animate-pulse mb-2" />)}
    </div>
  )

  if (!pending.length) return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 flex items-center gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
      <p className="text-sm text-gray-400">Aucun compte en attente d'approbation.</p>
    </div>
  )

  return (
    <>
      <div className="rounded-2xl border border-amber-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 bg-amber-50 border-b border-amber-100">
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <h3 className="text-sm font-bold text-amber-800">
            Comptes en attente d'approbation
          </h3>
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {pending.length}
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {pending.map(user => (
            <div key={user.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-amber-600">
                  {(user.full_name || user.email)?.[0]?.toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user.full_name || '—'}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>

              {/* Date */}
              <p className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                {new Date(user.created_at).toLocaleDateString('fr-FR')}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setApproving(user)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-green-500 hover:bg-green-600
                             text-white text-xs font-semibold transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approuver
                </button>
                <button
                  onClick={() => reject(user.id)}
                  className="h-8 w-8 rounded-lg border border-gray-200 hover:border-red-200
                             hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors
                             flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {approving && (
        <ApproveModal user={approving} onClose={() => setApproving(null)} />
      )}
    </>
  )
}

export default PendingAccountsPanel