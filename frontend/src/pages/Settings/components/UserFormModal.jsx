import React, { useEffect, useState } from 'react';
import { X, UserPlus, Pencil } from 'lucide-react';

const ROLE_LABELS = {
  user      : 'Utilisateur',
  admin     : 'Admin',
  superuser : 'Super Admin',
};

const UserFormModal = ({
  user,           // existing user object when editing (replaces `initialData` + `mode`)
  allowedRoles,
  apiculteurs,    // array of { id, company_name } — only passed from RoleManagementPage
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) => {
  const isEdit = Boolean(user);

  const [email,          setEmail]         = useState('');
  const [password,       setPassword]      = useState('');
  const [fullName,       setFullName]      = useState('');
  const [phone,          setPhone]         = useState('');
  const [location,       setLocation]      = useState('');
  const [role,           setRole]          = useState(allowedRoles?.[0] ?? 'user');
  const [apiculteurId,   setApiculteurId]  = useState('');

  // Sync fields whenever the user prop changes (edit ↔ add toggle)
  useEffect(() => {
    setEmail(user?.email        ?? '');
    setPassword('');
    setFullName(user?.full_name ?? '');
    setPhone(user?.phone        ?? '');
    setLocation(user?.location  ?? '');
    setRole(user?.role ?? allowedRoles?.[0] ?? 'user');
    setApiculteurId(user?.apiculteur_id ? String(user.apiculteur_id) : '');
  }, [user]);

  // Superusers must NOT have an apiculteur
  const needsApiculteur = role !== 'superuser' && Boolean(apiculteurs?.length);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      email,
      role,
      full_name : fullName  || null,
      phone     : phone     || null,
      location  : location  || null,
    };

    if (needsApiculteur && apiculteurId) {
      data.apiculteur_id = Number(apiculteurId);
    } else if (role === 'superuser') {
      data.apiculteur_id = null;
    }

    if (password) data.password = password;

    onSubmit(data);
  };

  const passwordOk = isEdit
    ? !password || password.length >= 6
    : password.trim().length >= 6;

  const apiculteurOk = !needsApiculteur || Boolean(apiculteurId);

  const valid = email.trim() && passwordOk && apiculteurOk;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#F5A623' }}
          >
            {isEdit
              ? <Pencil   className="w-4 h-4 text-white" />
              : <UserPlus className="w-4 h-4 text-white" />
            }
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">
              {isEdit ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
            </h2>
            {isEdit && (
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
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

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">

          {/* Full name */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Nom complet
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Prénom Nom"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                         text-sm text-gray-800 placeholder:text-gray-300
                         focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Adresse email <span className="text-red-400">*</span>
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
              {isEdit
                ? 'Nouveau mot de passe (laisser vide pour ne pas modifier)'
                : 'Mot de passe *'}
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

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+212 6XX XXX XXX"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                         text-sm text-gray-800 placeholder:text-gray-300
                         focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Localisation
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ville, Région"
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

          {/* Apiculteur — only shown when apiculteurs list is provided AND role ≠ superuser */}
          {needsApiculteur && (
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                Coopérative <span className="text-red-400">*</span>
              </label>
              <select
                value={apiculteurId}
                onChange={e => setApiculteurId(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5
                           text-sm text-gray-700 bg-white
                           focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
              >
                <option value="">— Choisir une coopérative —</option>
                {apiculteurs.map(a => (
                  <option key={a.id} value={String(a.id)}>
                    {a.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {isSubmitting
                ? 'Enregistrement…'
                : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;