import React, { useEffect, useState } from 'react';
import { X, UserPlus, Pencil } from 'lucide-react';

const ROLE_LABELS = {
  user      : 'Utilisateur',
  admin     : 'Admin',
  superuser : 'Super Admin',
};

const UserFormModal = ({
  mode,
  initialData,
  allowedRoles,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) => {
  const isEdit = mode === 'edit';

  const [email,    setEmail]    = useState(initialData?.email    ?? '');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState(
    initialData?.role ?? allowedRoles[0] ?? 'user'
  );

  useEffect(() => {
    setEmail(initialData?.email ?? '');
    setPassword('');
    setRole(initialData?.role ?? allowedRoles[0] ?? 'user');
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { email, role };
    if (password) data.password = password;
    if (!isEdit)  data.password = password; // required on create
    onSubmit(data);
  };

  const valid = email.trim() && (!isEdit ? password.trim().length >= 6 : true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
               style={{ backgroundColor: '#F5A623' }}>
            {isEdit
              ? <Pencil  className="w-4 h-4 text-white" />
              : <UserPlus className="w-4 h-4 text-white" />
            }
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">
              {isEdit ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </h2>
            {isEdit && (
              <p className="text-xs text-gray-400 mt-0.5">{initialData?.email}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full
                       hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="utilisateur@agri4.ma"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                         text-sm text-gray-800 placeholder:text-gray-300
                         focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              {isEdit ? 'Nouveau mot de passe (laisser vide pour ne pas modifier)' : 'Mot de passe'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••' : 'Min. 6 caractères'}
              required={!isEdit}
              minLength={password ? 6 : undefined}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                         text-sm text-gray-800 placeholder:text-gray-300
                         focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Rôle
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                         text-sm text-gray-700 bg-white
                         focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
            >
              {allowedRoles.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* API error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">
              {error.response?.data?.detail ?? 'Une erreur est survenue'}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium
                         text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!valid || isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold
                         transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#F5A623' }}
            >
              {isSubmitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;