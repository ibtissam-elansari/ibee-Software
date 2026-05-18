// src/pages/Auth/components/LoginForm.jsx
import React, { useState } from 'react'
import { Headphones } from 'lucide-react'
import { AuthInput, PasswordInput } from './AuthInput'
import AuthError  from './AuthError'
import AuthButton from './AuthButton'
import { useLogin } from '../hooks/useAuth'

const LoginForm = ({ onForgot, onRegister, onSupport }) => {
  const { submit, loading, error } = useLogin()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({ email, password })
  }

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Se connecter</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AuthInput
          label="E-mail"
          type="email"
          placeholder="Exemple@mail.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-600">Mot de passe</label>
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-amber-500 hover:text-amber-600 font-medium transition-colors"
            >
              Mot de passe oublié ?
            </button>
          </div>
          <PasswordInput
            placeholder="••••••••••••••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <AuthError message={error} />

        <AuthButton loading={loading} type="submit" className="mt-1">
          {loading ? 'Connexion…' : 'Connecter'}
        </AuthButton>
      </form>

      <div className="flex flex-col items-center gap-3">
        <div className="w-full h-px bg-gray-100" />
        <p className="text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={onRegister}
            className="text-amber-500 font-semibold hover:text-amber-600 transition-colors"
          >
            Créer un compte de test
          </button>
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onSupport}
          className="flex items-center gap-2 text-sm font-medium text-amber-500 hover:text-amber-600 transition-colors"
        >
          Contacter le support
          <Headphones className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default LoginForm