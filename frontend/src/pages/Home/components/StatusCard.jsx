import React from 'react'


const StatusCard = ({ card }) => {
  return (
      <div
        className={`
          relative 
          w-full 
          h-full 
          min-h-[150px] 
          transform 
          transition-transform 
          duration-300 
          preserve-3d
        `}
      >
          <div
            className={`
              flex flex-col justify-between
              absolute 
              inset-0
              bg-base-100 
              rounded-2xl 
              shadow-md 
              border 
              border-base-200 
              p-4 
              backface-hidden 
              transition-opacity 
              duration-300
            `}
            >
            <p className='text-xs text'>Etat</p>
            <div className='flex flex-row justify-between'> 
              <div>
                <h3 className='w-30'>{card.state}</h3>
              </div>
              <div>
                {card.icon}
              </div>
            </div>


            <div className='flex flex-col items-baseline w-full'>
              <h3 className="text-2xl font-bold">{card.title}</h3>
              <p className='text-xs py-2'>{card.subTitle}</p>
            </div>
        
         </div>
    </div>
  )
}

export default StatusCard
