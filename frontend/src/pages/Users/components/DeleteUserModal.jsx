import React from 'react';
import { X, Trash2 } from 'lucide-react';

const DeleteUserModal = ({ user, onConfirm, onClose, isSubmitting, error }) => {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Supprimer l'utilisateur</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
            <span className="font-semibold text-gray-900">{user.email}</span> ?
            Cette action est irréversible.
          </p>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">
              {error.response?.data?.detail ?? 'Une erreur est survenue'}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium
                         text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600
                         text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;