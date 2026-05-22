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