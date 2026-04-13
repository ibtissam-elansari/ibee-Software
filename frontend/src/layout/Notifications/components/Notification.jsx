import React from 'react'

const Notification = () => {
  return (
    <div
      className={`rounded-xl border p-4 cursor-pointer
        hover:shadow-md transition-all duration-200`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-800 tracking-wide">
          Alerte de Sécurité
        </span>
        <p>
          Ruche A est ouverte
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm `}>
            x
          </span>
        </div>
      </div>

    </div>
  )
}

export default Notification