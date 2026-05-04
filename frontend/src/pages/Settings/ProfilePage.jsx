// pages/Settings/ProfilePage.jsx
import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Camera } from 'lucide-react'
import { useMe, useUpdateMe }    from '../../hooks/useMe'
import useAuthStore              from '../../store/useAuthStore'
import usePreferencesStore       from '../../store/usePreferencesStore'
import { useApiculteur } from '../../hooks/useApiculteurs'

// ── Toggle ────────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    type      = "button"
    role      = "switch"
    aria-checked = {checked}
    disabled  = {disabled}
    onClick   = {() => !disabled && onChange(!checked)}
    className = {`
      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center
      rounded-full border-2 border-transparent transition-colors duration-200
      focus:outline-none
      ${checked   ? 'bg-amber-400' : 'bg-gray-200'}
      ${disabled  ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <span
      className = {`
        inline-block h-4 w-4 rounded-full bg-white shadow-md
        transition-transform duration-200 ease-in-out
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
)

// ── Field row ─────────────────────────────────────────────────────────────────
const FieldRow = ({ label, children, last = false }) => (
  <div className={`px-5 py-4 ${!last ? 'border-b border-gray-100' : ''}`}>
    <label className="block text-sm font-medium text-gray-800 mb-2">{label}</label>
    {children}
  </div>
)

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
)

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
)

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLE_LABEL = { superuser: 'Super admin', admin: 'Admin', user: 'Utilisateur' }
const ROLE_BADGE = {
  superuser: 'bg-purple-100 text-purple-600',
  admin    : 'bg-amber-100  text-amber-600',
  user     : 'bg-blue-100   text-blue-600',
}

// ── Page ──────────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { data: me, isLoading } = useMe()
  const { mutate: updateMe, isPending: saving, isSuccess, error } = useUpdateMe()
  const storeUser = useAuthStore(s => s.user)

  // ── Profile fields (backed by DB) ─────────────────────────────────────────
  const [fullName,    setFullName]    = useState('')
  const [email,       setEmail]       = useState('')
  const [phone,       setPhone]       = useState('')
  const [location,    setLocation]    = useState('')

  // ── Password ──────────────────────────────────────────────────────────────
  const [newPwd,      setNewPwd]      = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdError,    setPwdError]    = useState('')

  // ── Preferences (localStorage via Zustand persist) ────────────────────────
  const {
    notifUrgentOnly, setNotifUrgentOnly,
    notifAllAlerts,  setNotifAllAlerts,
    darkMode,        setDarkMode,
  } = usePreferencesStore()

  // Populate from /auth/me response
  useEffect(() => {
    if (!me) return
    setFullName(me.full_name ?? '')
    setEmail(me.email        ?? '')
    setPhone(me.phone        ?? '')
    setLocation(me.location  ?? '')
  }, [me])

  const handleSave = () => {
    setPwdError('')
    if (!me?.id) return

    const payload = {}

    // Only send changed fields
    if (fullName.trim() !== (me.full_name ?? '')) payload.full_name = fullName.trim()
    if (email.trim()    !==  me.email)            payload.email     = email.trim()
    if (phone.trim()    !== (me.phone    ?? ''))  payload.phone     = phone.trim()
    if (location.trim() !== (me.location ?? ''))  payload.location  = location.trim()

    // Password
    if (newPwd) {
      if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return }
      if (newPwd.length < 6)     { setPwdError('Minimum 6 caractères.'); return }
      payload.password = newPwd
    }

    // Preferences are already saved instantly on toggle — nothing to send here

    if (!Object.keys(payload).length && !newPwd) return

    updateMe({ id: me.id, data: payload }, {
      onSuccess: () => { setNewPwd(''); setConfirmPwd('') },
    })
  }

  const role        = me?.role ?? storeUser?.role ?? ''
  const displayName = me?.full_name || me?.email?.split('@')[0] || 'User'
  const initials    = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const apiculteurId = me?.apiculteur_id ?? storeUser?.apiculteur_id
  const { data: apiculteur } = useApiculteur(apiculteurId)

  return (
    <div className="min-h-full p-8" style={{ background: '#FDFAF4' }}>
      <div className="mx-auto bg-white p-10 rounded-2xl">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sécurité & Préférence</h1>
            <p className="text-sm text-gray-400 mt-1">
              Gérez vos informations personnelles, votre sécurité et vos préférences d'interface
            </p>
          </div>

          {/* Avatar + name + role */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200
                              flex items-center justify-center text-base font-bold text-gray-400">
                {initials}
              </div>
              <button className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white
                                 border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Camera className="w-2.5 h-2.5 text-gray-400" />
              </button>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{displayName}</p>
              <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold capitalize mt-1
                               ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-500'}`}>
                {ROLE_LABEL[role] ?? role}
              </span>
            </div>
          </div>
        </div>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-2 gap-8 items-start">

          {/* ── LEFT: Profile card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Profile</h2>
            </div>

            <FieldRow label="Nom & Prénom">
              <BareInput value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Nom & prénom" />
            </FieldRow>

            <FieldRow label="Adresse e-mail">
              <BareInput value={email} onChange={e => setEmail(e.target.value)}
                placeholder="exemple@mail.com" />
            </FieldRow>

            <FieldRow label="Téléphone">
              <BareInput value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+212 6000000000" />
            </FieldRow>

            <FieldRow label="Emplacement">
              <BareInput value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Agadir, Souss-Massa" />
            </FieldRow>

            <FieldRow label="Entreprise">
              <BareInput
                value     = {apiculteur?.company_name ?? ''}
                readOnly
                placeholder = "—"
              />
            </FieldRow>

            {/* Rôle — read-only */}
            <FieldRow label="Rôle" last>
              <p className="text-sm text-gray-700">{ROLE_LABEL[role] ?? role}</p>
            </FieldRow>
          </div>

          {/* ── RIGHT: Password + Preferences ── */}
          <div className="flex flex-col gap-6">

            {/* Password card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Changer le mot de passe</h2>
                <p className="text-xs text-gray-400 mt-0.5">Laissez vide pour ne pas modifier</p>
              </div>

              <PasswordRow label="Nouveau mot de passe" value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="••••••••••••••••••••••"
                show={showNew} onToggleShow={() => setShowNew(v => !v)} />

              <PasswordRow label="Confirmer le mot de passe" value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="••••••••••••••••••••••"
                show={showConfirm} onToggleShow={() => setShowConfirm(v => !v)} last />
            </div>

            {/* Preferences card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Préférence</h2>
              </div>

              {/* Notifications */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-4">Notification</p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">Uniquement les alertes d'urgence</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Recevez uniquement les alertes critiques
                      </p>
                    </div>
                    <Toggle checked={notifUrgentOnly} onChange={setNotifUrgentOnly} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">Tous les alertes</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Inclut les alertes d'attention et d'information
                      </p>
                    </div>
                    <Toggle checked={notifAllAlerts} onChange={setNotifAllAlerts} />
                  </div>
                </div>
              </div>

              {/* Accessibility */}
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-gray-800 mb-4">Accessibilité</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">Mode sombre</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Appliqué immédiatement sur cet appareil
                    </p>
                  </div>
                  <Toggle checked={darkMode} onChange={setDarkMode} />
                </div>
              </div>
            </div>

            {/* Feedback */}
            {pwdError  && <p className="text-xs text-red-500 -mt-2">{pwdError}</p>}
            {error     && <p className="text-xs text-red-500 -mt-2">Erreur lors de la sauvegarde.</p>}
            {isSuccess && !pwdError && (
              <p className="text-xs text-green-600 -mt-2">Modifications enregistrées ✓</p>
            )}

            {/* Save button */}
            <div className="flex justify-end">
              <button
                onClick   = {handleSave}
                disabled  = {saving || isLoading}
                className = "px-10 h-12 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage