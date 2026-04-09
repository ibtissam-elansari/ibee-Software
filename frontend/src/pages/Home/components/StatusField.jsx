import React from 'react'
import StatusCard from './StatusCard';
import cardsContent from '../config/cardsContent';


const StatusField = () => {
  return (
    <div className="flex flex-col gap-y-4 p-4 bg-base-100 rounded-2xl overflow-hidden w-full border border-base-200">
      {/* <h3 className="text-2xl font-bold text-primary">Les Ruches</h3> */}
      <div className="">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cardsContent.map((card) => (
            <StatusCard card={card}/>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StatusField
