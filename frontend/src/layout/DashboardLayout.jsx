import Sidebar from './Sidebar/Sidebar';
import React from 'react';
import { Outlet } from 'react-router';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <Sidebar />
      <main
        className={`
          fixed
          top-2
          bottom-2
          left-[17rem]
          right-[22rem]
          overflow-y-auto
          bg-base-100
          shadow-sm
          rounded-box
          transition-all duration-300 ease-in-out
        `}
      >
        <Outlet />
      </main>

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
        `}
      >
        <div className="p-5">
          <h2 className="text-base font-semibold">Notifications</h2>
        </div>
      </aside>
    </div>
  );
};

export default DashboardLayout;