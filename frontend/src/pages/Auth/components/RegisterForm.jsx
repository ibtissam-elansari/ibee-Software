// src/pages/Auth/components/RegisterForm.jsx
//
// Creates a "pending" account that the superuser must approve before the
// user can access the real platform. Until approved, the user lands on a
// PendingApprovalPage that explains the status.
//
// Backend endpoint needed:  POST /auth/register
//   body : { full_name, email, password, company_name?, reason? }
//   creates User with is_pending=true (add this field to the model)
//   returns: { message: "Account pending approval" }
//
// Superuser sees pending accounts in a queue (AccountManagementPage)
// and calls PATCH /auth/users/:id  { is_pending: false } to activate.

import React, { useState } from 'react'
import { AuthInput, PasswordInput } from './AuthInput'
import AuthError   from './AuthError'
import AuthButton  from './AuthButton'
import BackButton  from './BackButton'
import SuccessCard from './SuccessCard'
import { useRegisterTestAccount } from '../hooks/useAuth'

const validate = ({ full_name, email, password, confirm }) => {
  const e = {}
  if (!full_name.trim())          e.full_name = 'Nom requis'
  if (!email.trim())              e.email     = 'E-mail requis'
  if (password.length < 8)        e.password  = 'Minimum 8 caractères'
  if (password !== confirm)       e.confirm   = 'Les mots de passe ne correspondent pas'
  return e
}

const RegisterForm = ({ onBack }) => {
  const { submit, loading, done, error } = useRegisterTestAccount()

  const [form, setForm]   = useState({
    full_name: '', email: '', password: '', confirm: '',
    company_name: '', reason: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    const { confirm, ...payload } = form
    submit(payload)
  }

  if (done) return (
    <div className="flex flex-col gap-6">
      <BackButton onClick={onBack} />
      <SuccessCard
        title="Compte créé — en attente d'approbation"
        iconColor="text-amber-500"
        iconBg="bg-amber-50"
      >
        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
          Votre compte a bien été créé. Un administrateur doit l'approuver avant que vous
          puissiez accéder à la plateforme. Vous recevrez un e-mail dès que c'est fait.
        </p>

        <div className="w-full p-4 bg-amber-50 rounded-xl border border-amber-100 text-left mt-2">
          <p className="text-xs font-semibold text-amber-700 mb-2">Que se passe-t-il ensuite ?</p>
          <ol className="text-xs text-amber-600 space-y-1 list-decimal list-inside leading-relaxed">
            <li>L'équipe IBEE examine votre demande (24–48 h)</li>
            <li>Votre compte est activé et associé à une coopérative</li>
            <li>Vous recevez un e-mail de confirmation</li>
            <li>Vous pouvez vous connecter et explorer la plateforme</li>
          </ol>
        </div>

        <button
          onClick={onBack}
          className="mt-2 h-10 px-6 rounded-xl border border-gray-200 text-sm text-gray-600
                     hover:bg-gray-50 transition-colors font-medium"
        >
          Retour à la connexion
        </button>
      </SuccessCard>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <BackButton onClick={onBack} />

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
          Créer un compte de test
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Votre compte sera activé après validation par un administrateur.
          Vous pourrez ensuite explorer la plateforme avec des données réelles.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100">
        <span className="text-base flex-shrink-0">ℹ️</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          Le compte de test vous donne accès à une coopérative de démonstration avec des données
          simulées. Aucun engagement, aucune carte bancaire.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          label="Nom complet *"
          placeholder="Prénom Nom"
          value={form.full_name}
          onChange={set('full_name')}
          error={fieldErrors.full_name}
        />

        <AuthInput
          label="E-mail professionnel *"
          type="email"
          placeholder="vous@organisation.com"
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
        />

        <PasswordInput
          label="Mot de passe * (min. 8 caractères)"
          placeholder="••••••••"
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
        />

        <PasswordInput
          label="Confirmer le mot de passe *"
          placeholder="••••••••"
          value={form.confirm}
          onChange={set('confirm')}
          error={fieldErrors.confirm}
        />

        <AuthInput
          label="Organisation / Coopérative"
          placeholder="Nom de votre structure (optionnel)"
          value={form.company_name}
          onChange={set('company_name')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">
            Pourquoi souhaitez-vous tester IBEE ?
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                       placeholder:text-gray-300 focus:outline-none focus:border-amber-400 transition-colors resize-none"
            rows={3}
            placeholder="En quelques mots… (optionnel)"
            value={form.reason}
            onChange={set('reason')}
          />
        </div>

        <AuthError message={error} />

        <AuthButton loading={loading} type="submit">
          {loading ? 'Création du compte…' : 'Créer mon compte'}
        </AuthButton>
      </form>
    </div>
  )
}

export default RegisterForm