// src/pages/Auth/components/AuthInput.jsx
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const base = `
  w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
  placeholder:text-gray-300 focus:outline-none focus:border-amber-400 transition-colors
`

export const AuthInput = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-gray-600">{label}</label>}
    <input className={`${base} ${error ? 'border-red-300' : ''} ${className}`} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

export const PasswordInput = ({ label, error, ...props }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-gray-600">{label}</label>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={`${base} pr-11 ${error ? 'border-red-300' : ''}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}