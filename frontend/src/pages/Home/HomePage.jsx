import React from 'react'
import StatusField from './Cards/StatusField'
import HivesField from './Hives/HivesField'
import Notifications from './Notifications/Notifications'
const HomePage = () => {
  return (
    <>
      <div className="flex flex-col gap-4 p-4 h-full">
        <StatusField />
        <HivesField
          onHiveClick={(hive) => navigate(`/hives/${hive.id}`)}
          onAddHive={() => setAddModalOpen(true)}
        />
      </div>
      <Notifications/>
    </>
    
  )
}

export default HomePage