import React from 'react';
import menuItems from './config/menuItems';
import { MenuItem, Divider } from './components';
import { LogOut } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside
      className="fixed left-2 top-2 bottom-2 w-64 rounded-box bg-base-100 shadow-sm z-20 flex flex-col"
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-base-200">
        <div className="w-9 h-9 rounded-lg bg-[#F5A623] flex items-center justify-center flex-shrink-0">
          {/* Honeycomb/bee icon — swap with your actual SVG asset */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2L14.5 4.75V10.25L10 13L5.5 10.25V4.75L10 2Z"
              fill="white" stroke="white" strokeWidth="0.5"
            />
            <circle cx="10" cy="7.5" r="2" fill="#F5A623" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-wide text-base-content">IBEE</span>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1" role="menu">
          {menuItems.map((item, index) =>
            item.type === 'divider' ? (
              <Divider key={`divider-${index}`} />
            ) : (
              <MenuItem key={item.href || `item-${index}`} item={item} />
            )
          )}
        </ul>
      </nav>
      
      <div className="px-3 py-4 border-t border-base-200">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                     text-error hover:bg-error/10
                     transition-colors duration-200 ease-in-out
                     text-sm font-medium"
          onClick={() => { /* dispatch(logout()) */ }}
          aria-label="Déconnexion"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;