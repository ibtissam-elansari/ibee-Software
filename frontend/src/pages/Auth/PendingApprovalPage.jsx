// src/pages/Auth/PendingApprovalPage.jsx
// Shown when a user logs in but their account is still pending superuser approval.
// Route: /pending-approval  (add to routes.jsx, outside ProtectedRoute)
import React from 'react'
import { Clock, LogOut, Mail, RefreshCw } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { useMe } from '../../hooks/useMe'

const Step = ({ n, label, done }) => (
  <div className="flex items-center gap-3">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
      ${done ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
      {done ? '✓' : n}
    </div>
    <p className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
      {label}
    </p>
  </div>
)

const PendingApprovalPage = () => {
  const navigate  = useNavigate()
  const logout    = useAuthStore(s => s.logout)
  const { data: me } = useMe()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleRefresh = () => {
    // Re-fetch /auth/me — if account is now approved, ProtectedRoute
    // will redirect automatically on next render.
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FAFAF7' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5A623' }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L15.5 4.75V10.25L11 13L6.5 10.25V4.75L11 2Z" fill="white" opacity="0.9"/>
              <circle cx="11" cy="7.5" r="2.2" fill="#F5A623"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">IBEE</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
            Compte en attente d'approbation
          </h1>
          <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
            {me?.email
              ? <>Votre compte <span className="font-medium text-gray-600">{me.email}</span> a été créé avec succès.</>
              : 'Votre compte a été créé avec succès.'
            }{' '}
            Un administrateur doit le valider avant que vous puissiez accéder à la plateforme.
          </p>

          {/* Progress steps */}
          <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl mb-6">
            <Step n={1} label="Compte créé"                      done={true}  />
            <Step n={2} label="Validation par l'administrateur"  done={false} />
            <Step n={3} label="Accès à la plateforme"            done={false} />
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-50 rounded-xl border border-blue-100 mb-6">
            <Mail className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Vous recevrez un e-mail dès que votre compte sera activé. Cela prend généralement 24–48 heures.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleRefresh}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl
                         border border-gray-200 text-sm font-medium text-gray-600
                         hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Vérifier le statut
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl
                         text-sm font-medium text-red-400 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Une question ?{' '}
          <a href="mailto:support@ibee.ma" className="text-amber-500 hover:underline">
            support@ibee.ma
          </a>
        </p>
      </div>
    </div>
  )
}

export default PendingApprovalPage