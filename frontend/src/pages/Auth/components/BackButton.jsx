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