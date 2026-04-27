// pages/Settings/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Camera, Headphones } from 'lucide-react';
import { useMe, useUpdateMe } from '../../hooks/useMe';
import useAuthStore           from '../../store/useAuthStore';

// ── Toggle ────────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    onClick   = {() => onChange(!checked)}
    className = {`relative w-11 h-6 rounded-full transition-colors flex-shrink-0
                  ${checked ? 'bg-amber-400' : 'bg-gray-200'}`}
  >
    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform
                      ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

// ── Field row inside a card ───────────────────────────────────────────────────
// Renders label + input separated by a bottom border (matching Figma's card rows)
const FieldRow = ({ label, children, last = false }) => (
  <div className={`px-5 py-4 ${!last ? 'border-b border-gray-100' : ''}`}>
    <label className="block text-sm font-medium text-gray-800 mb-2">{label}</label>
    {children}
  </div>
);

const BareInput = ({ value, onChange, placeholder, readOnly = false, type = 'text' }) => (
  <input
    type        = {type}
    value       = {value}
    onChange    = {onChange}
    placeholder = {placeholder}
    readOnly    = {readOnly}
    className   = {`w-full text-sm border-none outline-none bg-transparent placeholder:text-gray-300
                    ${readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}`}
  />
);

const PasswordRow = ({ label, value, onChange, placeholder, show, onToggleShow, last = false }) => (
  <div className={`px-5 py-4 ${!last ? 'border-b border-gray-100' : ''}`}>
    <label className="block text-sm font-medium text-gray-800 mb-2">{label}</label>
    <div className="flex items-center justify-between">
      <input
        type        = {show ? 'text' : 'password'}
        value       = {value}
        onChange    = {onChange}
        placeholder = {placeholder}
        className   = "flex-1 text-sm border-none outline-none bg-transparent text-gray-700 placeholder:text-gray-300"
      />
      <button onClick={onToggleShow} className="text-gray-300 hover:text-gray-500 ml-2 flex-shrink-0">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

// ── Role display label ────────────────────────────────────────────────────────
const ROLE_LABEL = { superuser: 'Super admin', admin: 'Admin', user: 'Utilisateur' };
const ROLE_BADGE_COLORS = {
  superuser: 'bg-purple-100 text-purple-600',
  admin    : 'bg-amber-100  text-amber-600',
  user     : 'bg-blue-100   text-blue-600',
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { data: me, isLoading } = useMe();
  const { mutate: updateMe, isPending: saving, isSuccess, error } = useUpdateMe();
  const storeUser = useAuthStore(s => s.user);

  const [fullName,    setFullName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [location,    setLocation]    = useState('');
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [urgentOnly,  setUrgentOnly]  = useState(true);
  const [allAlerts,   setAllAlerts]   = useState(true);
  const [darkMode,    setDarkMode]    = useState(false);
  const [pwdError,    setPwdError]    = useState('');

  useEffect(() => {
    if (!me) return;
    setFullName(me.full_name ?? '');
    setEmail(me.email        ?? '');
    setPhone(me.phone        ?? '');
    setLocation(me.location  ?? '');
    setUrgentOnly(me.notif_urgent_only ?? true);
    setAllAlerts(me.notif_all          ?? true);
    setDarkMode(me.dark_mode           ?? false);
  }, [me]);

  const handleSave = () => {
    setPwdError('');
    if (!me?.id) return;
    const payload = {};
    if (fullName.trim() !== (me.full_name ?? ''))  payload.full_name = fullName.trim();
    if (email.trim()    !== me.email)               payload.email     = email.trim();
    if (phone.trim()    !== (me.phone    ?? ''))    payload.phone     = phone.trim();
    if (location.trim() !== (me.location ?? ''))    payload.location  = location.trim();
    payload.notif_urgent_only = urgentOnly;
    payload.notif_all         = allAlerts;
    payload.dark_mode         = darkMode;
    if (newPwd) {
      if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return; }
      if (newPwd.length < 6)     { setPwdError('Minimum 6 caractères.'); return; }
      payload.password = newPwd;
    }
    if (!Object.keys(payload).length) return;
    updateMe({ id: me.id, data: payload }, {
      onSuccess: () => { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); },
    });
  };

  const role        = me?.role ?? storeUser?.role ?? '';
  const displayName = me?.full_name || me?.email?.split('@')[0] || 'User name';
  const initials    = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-full p-8" style={{ background: '#FDFAF4' }}>

      {/* ── Centered container ── */}
      <div className=" mx-auto bg-white p-10 rounded-2xl">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sécurité & Préférence</h1>
            <p className="text-sm text-gray-400 mt-1">
              Gérez vos informations personnelles, votre sécurité et vos préférences d'interface
            </p>
          </div>

          {/* Avatar + name + role badge */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200
                              flex items-center justify-center text-base font-bold text-gray-400">
                {initials}
              </div>
              <button className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white
                                 border border-gray-200 flex items-center justify-center
                                 hover:bg-gray-50 transition-colors">
                <Camera className="w-2.5 h-2.5 text-gray-400" />
              </button>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{displayName}</p>
              <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold
                               capitalize mt-1 ${ROLE_BADGE_COLORS[role] ?? 'bg-gray-100 text-gray-500'}`}>
                {ROLE_LABEL[role] ?? role}
              </span>
            </div>
          </div>
        </div>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-2 gap-8 items-start">

          {/* ══ LEFT CARD — Profile ══ */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Profile</h2>
            </div>

            <FieldRow label="Nom & Prénom">
              <BareInput value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Nom & prénom" />
            </FieldRow>

            <FieldRow label="Adresse e-mail">
              <BareInput value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email: exemple@mail.com" />
            </FieldRow>

            <FieldRow label="Téléphone">
              <BareInput value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+212 6000000000" />
            </FieldRow>

            <FieldRow label="Emplacement">
              <BareInput value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Agadir, Souss-Massa" />
            </FieldRow>

            {/* Entreprise */}
            <FieldRow label="Entreprise">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Entreprise</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </FieldRow>

            {/* Rôle — read-only dropdown */}
            <FieldRow label="Rôle" last>
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>{ROLE_LABEL[role] ?? role}</span>
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </FieldRow>
          </div>

          {/* ══ RIGHT SIDE ══ */}
          <div className="flex flex-col gap-6">

            {/* Password card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Changer le mot de passe</h2>
              </div>

              <PasswordRow label="Mot de passe actuel"  value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                placeholder="••••••••••••••••••••••"
                show={showCurrent} onToggleShow={() => setShowCurrent(v => !v)} />

              <PasswordRow label="Nouveau mot de passe" value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="••••••••••••••••••••••"
                show={showNew} onToggleShow={() => setShowNew(v => !v)} />

              <PasswordRow label="Confirme mot de passe" value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="••••••••••••••••••••••"
                show={showConfirm} onToggleShow={() => setShowConfirm(v => !v)} last />
            </div>

            {/* Preferences card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Préférence</h2>
              </div>

              {/* Notification section */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-4">Notification</p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Uniquement les alertes d'urgence</span>
                    <Toggle checked={urgentOnly} onChange={setUrgentOnly} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Tous les alertes</span>
                    <Toggle checked={allAlerts} onChange={setAllAlerts} />
                  </div>
                </div>
              </div>

              {/* Accessibility section */}
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-gray-800 mb-4">Accessibilité</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Mode sombre</span>
                  <Toggle checked={darkMode} onChange={setDarkMode} />
                </div>
              </div>
            </div>

            {/* Error / success feedback */}
            {pwdError  && <p className="text-xs text-red-500 -mt-2">{pwdError}</p>}
            {error     && <p className="text-xs text-red-500 -mt-2">Erreur lors de la sauvegarde.</p>}
            {isSuccess && !pwdError && <p className="text-xs text-green-600 -mt-2">Modifications enregistrées ✓</p>}

            {/* Save — bottom right, matches Figma */}
            <div className="flex justify-end">
              <button
                onClick   = {handleSave}
                disabled  = {saving || isLoading}
                className = "px-10 h-12 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;