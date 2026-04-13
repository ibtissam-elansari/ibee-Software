import React from 'react'
import Notification from './components/Notification'

const Notifications = () => {
  return (
      <aside
        className={`
          fixed
          top-2
          bottom-2
          right-2
          w-80
          bg-base-100
          shadow-sm
          rounded-box
          overflow-y-auto
          z-10
        `}
      >
        <div className="p-5">
          <h2 className="text-base font-semibold">Notifications</h2>
          {/* <Notification/>
          <Notification/>
          <Notification/>
          <Notification/>
          <Notification/> */}
        </div>
      </aside>
  )
}

export default Notifications
