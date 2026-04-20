import React from 'react';
import { Eye, EyeOff, Camera, Check, AlertCircle } from 'lucide-react';

const ROLE_LABEL = { superuser: 'Super admin', admin: 'Admin', user: 'Utilisateur' };

const ProfilePanel = ({
  me, loadingMe, actorRole,
  email, setEmail,
  newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  showNew, setShowNew,
  showConfirm, setShowConfirm,
  passwordError,
  handleSave, isSaving, saveSuccess, saveError,
}) => {
  const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 
    placeholder:text-gray-300 bg-white focus:outline-none focus:border-amber-400 transition-colors`;
  const skeleton = 'h-11 rounded-xl bg-gray-100 animate-pulse w-full';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5 h-fit">
      <h2 className="text-xl font-bold text-gray-900">Profile</h2>

      {/* Avatar */}
      <div className="relative w-fit mx-auto">
        <div className="w-24 h-24 rounded-full border-2 border-purple-200 bg-purple-50 flex items-center justify-center overflow-hidden">
          {loadingMe
            ? <div className="w-full h-full bg-gray-100 animate-pulse" />
            : <span className="text-3xl font-bold text-purple-400">{me?.email?.[0]?.toUpperCase() ?? '?'}</span>
          }
        </div>
        <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Camera className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800">Adresse e-mail</label>
        {loadingMe
          ? <div className={skeleton} />
          : <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="exemple@mail.com" className={inputCls} />
        }
      </div>

      {/* Role (read-only) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800">Rôle</label>
        <div className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 bg-gray-50 select-none">
          {ROLE_LABEL[actorRole] ?? actorRole ?? '—'}
        </div>
      </div>

      {/* Password section */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Changer le mot de passe</p>
          <p className="text-xs text-gray-400 mt-0.5">Laissez vide pour ne pas modifier</p>
        </div>

        {/* New password */}
        <div className="relative">
          <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder="Nouveau mot de passe" className={inputCls + ' pr-10'} />
          <button type="button" onClick={() => setShowNew(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Confirm password */}
        <div className="relative">
          <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirmer le mot de passe" className={inputCls + ' pr-10'} />
          <button type="button" onClick={() => setShowConfirm(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {passwordError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{passwordError}</p>
        </div>
      )}
      {saveError && !passwordError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{saveError.response?.data?.detail ?? "Erreur lors de l'enregistrement"}</p>
        </div>
      )}
      {saveSuccess && !passwordError && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5">
          <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <p className="text-xs text-green-700">Modifications enregistrées avec succès</p>
        </div>
      )}

      {/* Save button */}
      <button onClick={handleSave} disabled={isSaving || loadingMe}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: '#F5A623' }}>
        {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </button>

      {/* Role badge */}
      <div className="flex justify-center mt-1">
        <span className="px-8 py-2.5 rounded-xl bg-purple-100 text-purple-500 text-base font-semibold">
          {ROLE_LABEL[actorRole] ?? actorRole ?? '—'}
        </span>
      </div>
    </div>
  );
};

export default ProfilePanel;