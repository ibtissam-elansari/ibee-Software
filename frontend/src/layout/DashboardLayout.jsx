import Sidebar from './Sidebar/Sidebar';
import React from 'react';
import { Outlet } from 'react-router';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-base-200 " style={{ background: '#FBFAF7' }}>
      <Sidebar />
      <main
        className="
          fixed top-2 bottom-2
          left-[17rem] right-2
          overflow-y-auto
          bg-base-100 shadow-sm rounded-box
          transition-all duration-300 ease-in-out
        "
        
      >
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;