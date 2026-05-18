// src/pages/Auth/components/ForgotPasswordForm.jsx
import React, { useState } from 'react'
import { AuthInput }  from './AuthInput'
import AuthError      from './AuthError'
import AuthButton     from './AuthButton'
import BackButton     from './BackButton'
import SuccessCard    from './SuccessCard'
import { useForgotPassword } from '../hooks/useAuth'

const ForgotPasswordForm = ({ onBack }) => {
  const { submit, loading, sent, error } = useForgotPassword()
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    submit(email)
  }

  if (sent) return (
    <div className="flex flex-col gap-6">
      <BackButton onClick={onBack} />
      <SuccessCard title="E-mail envoyé">
        <p className="text-sm text-gray-400 leading-relaxed">
          Si un compte existe pour <span className="font-medium text-gray-600">{email}</span>,
          vous recevrez un lien de réinitialisation dans quelques minutes.
        </p>
        <p className="text-xs text-gray-300">Vérifiez aussi vos spams.</p>
        <button
          onClick={onBack}
          className="mt-2 h-10 px-6 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
        >
          Retour à la connexion
        </button>
      </SuccessCard>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <BackButton onClick={onBack} />

      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-gray-400">
          Saisissez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          label="E-mail"
          type="email"
          placeholder="Exemple@mail.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <AuthError message={error} />
        <AuthButton loading={loading} type="submit">
          {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
        </AuthButton>
      </form>
    </div>
  )
}

export default ForgotPasswordForm