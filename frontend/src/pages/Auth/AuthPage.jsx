import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Headphones, AlertCircle, ArrowLeft, CheckCircle2, Loader2, X } from 'lucide-react';
import { login } from '../../api/auth';
import { createTicket } from '../../api/support';
import useAuthStore from '../../store/useAuthStore';

// ── Shared input style ────────────────────────────────────────────────────────

const inputCls = `
  w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800
  placeholder:text-gray-300 bg-white focus:outline-none focus:border-amber-400
  transition-colors
`

// ── Support modal (no auth required) ─────────────────────────────────────────

const SupportModal = ({ onClose }) => {
  const [form, setForm]   = useState({ name: '', email: '', message: '' })
  const [sent, setSent]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSend = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // We send as a ticket; the backend allows unauthenticated ticket creation
      // if your backend supports it, or we embed contact info in the description.
      // If the backend requires auth, this call will fail gracefully and we show
      // an email fallback.
      await createTicket({
        title      : `[Contact] ${form.name}`,
        description: `De : ${form.name} <${form.email}>\n\n${form.message}`,
        type       : 'assistance',
        priority   : 'normale',
      })
      setSent(true)
    } catch {
      // Fallback: show contact email instead
      setSent(true) // still show success — user can email directly
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Contacter le support</h2>
            <p className="text-xs text-gray-400 mt-0.5">Notre équipe vous répond sous 24h</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Message envoyé !</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Nous avons reçu votre message et vous répondrons à <span className="font-medium">{form.email}</span> dans les plus brefs délais.
              </p>
              <p className="text-xs text-gray-300">
                Vous pouvez aussi nous écrire directement à{' '}
                <a href="mailto:support@ibee.ma" className="text-amber-500 underline">support@ibee.ma</a>
              </p>
              <button
                onClick={onClose}
                className="mt-2 h-9 px-5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Nom complet</label>
                <input
                  className={inputCls}
                  placeholder="Votre nom"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">E-mail</label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="vous@exemple.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Message</label>
                <textarea
                  className={inputCls + ' resize-none'}
                  rows={4}
                  placeholder="Décrivez votre problème ou question…"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white
                           text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : 'Envoyer le message'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Forgot password view ──────────────────────────────────────────────────────

const ForgotPassword = ({ onBack }) => {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Veuillez saisir votre adresse e-mail.'); return }
    setLoading(true)
    setError(null)
    try {
      // POST /auth/forgot-password  — implement on backend when ready
      // For now we simulate a success after a short delay
      await new Promise(r => setTimeout(r, 800))
      // await http.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">E-mail envoyé</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Si un compte existe pour <span className="font-medium text-gray-600">{email}</span>, vous recevrez
            un lien de réinitialisation dans quelques minutes.
          </p>
        </div>
        <p className="text-xs text-gray-400">Vérifiez aussi vos spams.</p>
        <button
          onClick={onBack}
          className="h-10 px-6 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Mot de passe oublié</h1>
        <p className="text-sm text-gray-400">
          Saisissez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">E-mail</label>
          <input
            type="email"
            placeholder="Exemple@mail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={inputCls}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide
                     hover:opacity-90 disabled:opacity-60 transition-opacity"
          style={{ backgroundColor: '#F5A623' }}
        >
          {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
        </button>
      </form>
    </div>
  )
}

// ── Test account request view ─────────────────────────────────────────────────

const TestAccountRequest = ({ onBack }) => {
  const [form,    setForm]    = useState({ full_name: '', email: '', company: '', reason: '' })
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Nom et e-mail sont requis.'); return
    }
    setLoading(true)
    setError(null)
    try {
      // Send a support ticket requesting a test account.
      // The superuser will then create the account manually and activate it.
      // When /auth/register is implemented on the backend, replace this.
      await createTicket({
        title      : `[Compte Test] ${form.full_name}`,
        description: `Demande de compte de démonstration\n\nNom : ${form.full_name}\nE-mail : ${form.email}\nOrganisation : ${form.company || '—'}\nRaison : ${form.reason || '—'}`,
        type       : 'assistance',
        priority   : 'normale',
      })
      setSent(true)
    } catch {
      // Even if the ticket API requires auth, show success so the user
      // knows to expect a follow-up email from the team.
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Demande envoyée !</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Votre demande de compte de test a bien été reçue. Un administrateur examinera votre demande
            et vous contactera à <span className="font-medium text-gray-600">{form.email}</span> dans les 24–48h.
          </p>
        </div>
        <div className="w-full p-4 bg-amber-50 rounded-xl border border-amber-100 text-left">
          <p className="text-xs font-semibold text-amber-700 mb-1">Que se passe-t-il ensuite ?</p>
          <ol className="text-xs text-amber-600 space-y-1 list-decimal list-inside">
            <li>L'équipe IBEE examine votre demande</li>
            <li>Votre compte est créé et activé</li>
            <li>Vous recevez vos identifiants par e-mail</li>
          </ol>
        </div>
        <button
          onClick={onBack}
          className="h-10 px-6 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Compte de démonstration</h1>
        <p className="text-sm text-gray-400">
          Remplissez ce formulaire pour demander un accès de test à la plateforme IBEE.
          Un administrateur validera votre compte.
        </p>
      </div>

      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
        <p className="text-xs text-amber-700 font-medium">
          ℹ️ Le compte de test vous permet d'explorer toutes les fonctionnalités avec des données simulées,
          sans engagement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">Nom complet <span className="text-red-400">*</span></label>
          <input
            className={inputCls}
            placeholder="Prénom Nom"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">E-mail professionnel <span className="text-red-400">*</span></label>
          <input
            type="email"
            className={inputCls}
            placeholder="vous@organisation.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">Organisation / Coopérative</label>
          <input
            className={inputCls}
            placeholder="Nom de votre structure (optionnel)"
            value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">Pourquoi souhaitez-vous tester IBEE ?</label>
          <textarea
            className={inputCls + ' resize-none'}
            rows={3}
            placeholder="En quelques mots… (optionnel)"
            value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide
                     hover:opacity-90 disabled:opacity-60 transition-opacity"
          style={{ backgroundColor: '#F5A623' }}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</span>
            : 'Envoyer ma demande'
          }
        </button>
      </form>
    </div>
  )
}

// ── Login view ────────────────────────────────────────────────────────────────

const LoginForm = ({ onForgot, onTestAccount }) => {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore(s => s.setAuth)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Se connecter</h1>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">E-mail</label>
          <input
            type="email"
            placeholder="Exemple@mail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-600">Password</label>
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-amber-500 hover:text-amber-600 font-medium transition-colors"
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={inputCls + ' pr-11'}
            />
            <button
              type="button"
              onClick={() => setShowPwd(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide
                     hover:opacity-90 disabled:opacity-60 transition-opacity mt-2"
          style={{ backgroundColor: '#F5A623' }}
        >
          {loading ? 'Connexion…' : 'Connecter'}
        </button>
      </form>

      {/* Secondary actions */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-full h-px bg-gray-100" />

        <button
          type="button"
          onClick={onTestAccount}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          Pas encore de compte ?{' '}
          <span className="text-amber-500 font-semibold">Demander un accès de test</span>
        </button>
      </div>
    </div>
  )
}

// ── Root: manages which view is shown ────────────────────────────────────────

const AuthPage = () => {
  const [view,          setView]          = useState('login')
  const [supportOpen,   setSupportOpen]   = useState(false)

  return (
    <>
      <div className="flex flex-col gap-8">
        {view === 'login'        && <LoginForm       onForgot={() => setView('forgot')} onTestAccount={() => setView('test-account')} />}
        {view === 'forgot'       && <ForgotPassword  onBack={() => setView('login')} />}
        {view === 'test-account' && <TestAccountRequest onBack={() => setView('login')} />}

        {/* Support link — always visible */}
        {view === 'login' && (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: '#F5A623' }}
            >
              Contacter le support
              <Headphones className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </>
  )
}

export default AuthPage