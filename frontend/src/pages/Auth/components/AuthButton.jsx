// src/pages/Auth/components/AuthButton.jsx
import React from 'react'
import { Loader2 } from 'lucide-react'

const AuthButton = ({ loading, children, className = '', ...props }) => (
  <button
    disabled={loading}
    className={`w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide
                hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2
                ${className}`}
    style={{ backgroundColor: '#F5A623' }}
    {...props}
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
    {children}
  </button>
)

export default AuthButton