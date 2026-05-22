// src/pages/Auth/components/AuthError.jsx
import React from 'react'
import { AlertCircle } from 'lucide-react'

const AuthError = ({ message }) => {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <p className="text-xs text-red-600">{message}</p>
    </div>
  )
}

export default AuthError