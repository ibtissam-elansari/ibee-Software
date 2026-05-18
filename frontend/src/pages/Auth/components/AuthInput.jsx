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
EOF

cat > /mnt/user-data/outputs/auth/Auth/components/AuthError.jsx << 'EOF'
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
EOF

cat > /mnt/user-data/outputs/auth/Auth/components/AuthButton.jsx << 'EOF'
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
EOF

cat > /mnt/user-data/outputs/auth/Auth/components/BackButton.jsx << 'EOF'
// src/pages/Auth/components/BackButton.jsx
import React from 'react'
import { ArrowLeft } from 'lucide-react'

const BackButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit"
  >
    <ArrowLeft className="w-4 h-4" /> Retour
  </button>
)

export default BackButton
EOF

cat > /mnt/user-data/outputs/auth/Auth/components/SuccessCard.jsx << 'EOF'
// src/pages/Auth/components/SuccessCard.jsx
import React from 'react'
import { CheckCircle2 } from 'lucide-react'

const SuccessCard = ({ title, children, iconColor = 'text-green-500', iconBg = 'bg-green-50' }) => (
  <div className="flex flex-col items-center gap-4 py-4 text-center">
    <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center`}>
      <CheckCircle2 className={`w-7 h-7 ${iconColor}`} />
    </div>
    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    {children}
  </div>
)

export default SuccessCard