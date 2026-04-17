import React from 'react';
import { Eye, EyeOff, Camera, UserCircle2 } from 'lucide-react';

const ProfilePanel = ({
  actorRole,
  name,  setName,
  email, setEmail,
  oldPassword,     setOldPassword,
  newPassword,     setNewPassword,
  confirmPassword, setConfirmPassword,
  showOld, setShowOld,
  showNew, setShowNew,
  showConfirm, setShowConfirm,
  passwordError,
  handleSave,
  isSaving,
  saveSuccess,
  saveError,
}) => {
  const ROLE_LABEL = {
    superuser : 'Super admin',
    admin     : 'Admin',
    user      : 'Utilisateur',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
      <h2 className="text-xl font-bold text-gray-900">Profile</h2>

      {/* ── Avatar ── */}
      <div className="flex justify-center relative w-fit mx-auto">
        <div className="w-24 h-24 rounded-full border-2 border-purple-200 bg-purple-50
                        flex items-center justify-center text-purple-300">
          <UserCircle2 className="w-14 h-14" />
        </div>
        <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border
                           border-gray-200 flex items-center justify-center shadow-sm
                           hover:bg-gray-50 transition-colors">
          <Camera className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* ── Nom & Prénom ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800">Nom & Prénom</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nom & prénom"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                     text-gray-700 placeholder:text-gray-300
                     focus:outline-none focus:border-amber-400 transition-colors"
        />
      </div>

      {/* ── Email ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800">Adresse e-mail</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email: exemple@mail.com"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                     text-gray-700 placeholder:text-gray-300
                     focus:outline-none focus:border-amber-400 transition-colors"
        />
      </div>

      {/* ── Password section ── */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-gray-800">Change mot de pass</p>

        {/* Old password */}
        <div className="relative">
          <input
            type={showOld ? 'text' : 'password'}
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            placeholder="Ancien mot de passe"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm
                       text-gray-700 placeholder:text-gray-300
                       focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowOld(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* New password */}
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Nouveau mot de passe"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm
                       text-gray-700 placeholder:text-gray-300
                       focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowNew(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Confirm password */}
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Nouveau mot de passe"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm
                       text-gray-700 placeholder:text-gray-300
                       focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error / success feedback */}
      {passwordError && (
        <p className="text-xs text-red-500">{passwordError}</p>
      )}
      {saveError && (
        <p className="text-xs text-red-500">
          {saveError.response?.data?.detail ?? 'Erreur lors de l\'enregistrement'}
        </p>
      )}
      {saveSuccess && (
        <p className="text-xs text-green-600">Modifications enregistrées ✓</p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold
                   disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#F5A623' }}
      >
        {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </button>

      {/* Role badge — bottom of card, lavender pill matching Figma */}
      <div className="flex justify-center mt-2">
        <span className="px-8 py-2.5 rounded-xl bg-purple-100 text-purple-500 text-lg font-semibold">
          {ROLE_LABEL[actorRole] ?? actorRole ?? '—'}
        </span>
      </div>
    </div>
  );
};

export default ProfilePanel;