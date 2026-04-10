import React from 'react'
import StatusCard from './StatusCard';
import cards from '../config/cardsContent'


const StatusField = () => {
  return (
    <div className="flex flex-col gap-y-4 p-4 bg-base-100 rounded-2xl overflow-hidden w-full border border-base-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <StatusCard key={i} card={card} />
        ))}
      </div>
    </div>
  )
}

export default StatusField
