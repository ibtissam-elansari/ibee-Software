// src/pages/Auth/components/SupportModal.jsx
import React, { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { AuthInput } from './AuthInput'
import AuthError  from './AuthError'
import AuthButton from './AuthButton'
import { useContactSupport } from '../hooks/useAuth'

const SupportModal = ({ onClose }) => {
  const { submit, loading, sent, error } = useContactSupport()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [fieldError, setFieldError] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSend = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFieldError('Veuillez remplir tous les champs.')
      return
    }
    setFieldError(null)
    submit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Contacter le support</h2>
            <p className="text-xs text-gray-400 mt-0.5">Notre équipe vous répond sous 24 h</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Message envoyé !</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Nous vous répondrons à{' '}
                <span className="font-medium">{form.email}</span> dans les plus brefs délais.
              </p>
              <p className="text-xs text-gray-300">
                Ou écrivez-nous à{' '}
                <a href="mailto:support@ibee.ma" className="text-amber-500 underline">
                  support@ibee.ma
                </a>
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
              <AuthInput
                label="Nom complet"
                placeholder="Votre nom"
                value={form.name}
                onChange={set('name')}
              />
              <AuthInput
                label="E-mail"
                type="email"
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={set('email')}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600">Message</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                             placeholder:text-gray-300 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  rows={4}
                  placeholder="Décrivez votre problème ou question…"
                  value={form.message}
                  onChange={set('message')}
                />
              </div>

              <AuthError message={fieldError || error} />

              <AuthButton loading={loading} onClick={handleSend} type="button">
                {loading ? 'Envoi…' : 'Envoyer le message'}
              </AuthButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupportModal