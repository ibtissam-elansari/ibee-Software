import React from 'react'
import StatusField from './components/StatusField'
import HivesField from './components/HivesField'

const HomePage = () => {
  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <StatusField />
      <HivesField />

      {/* Live indicator — bottom of page */}
      <div className="flex items-center gap-2 px-1 pb-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <p className="text-xs text-base-content/50">
          Surveillance en direct · Dernière mise à jour : maintenant
        </p>
      </div>
    </div>
  )
}

export default HomePage