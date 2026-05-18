// src/pages/Auth/hooks/useAuth.js
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { login, registerTestAccount } from '../../../api/auth'
import { sendSupportMessage } from '../../../api/support'
import useAuthStore from '../../../store/useAuthStore'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore(s => s.setAuth)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const submit = async ({ email, password }) => {
    setError(null)
    setLoading(true)
    try {
      const data = await login({ email, password })
      setAuth(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou mot de passe invalide')
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, error }
}

export function useForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState(null)

  const submit = async (email) => {
    setError(null)
    setLoading(true)
    try {
      // POST /auth/forgot-password — implement on backend when ready
      // await http.post('/auth/forgot-password', { email })
      await new Promise(r => setTimeout(r, 700)) // simulate network
      setSent(true)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, sent, error }
}

export function useRegisterTestAccount() {
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState(null)

  const submit = async (payload) => {
    setError(null)
    setLoading(true)
    try {
      // POST /auth/register  — creates user with is_pending=true
      // The superuser sees pending accounts in a queue and approves them.
      await registerTestAccount(payload)
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, done, error }
}

export function useContactSupport() {
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState(null)

  const submit = async ({ name, email, message }) => {
    setError(null)
    setLoading(true)
    try {
      await sendSupportMessage({ name, email, message })
      setSent(true)
    } catch {
      setSent(true) // show success anyway; user can email directly as fallback
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, sent, error }
}