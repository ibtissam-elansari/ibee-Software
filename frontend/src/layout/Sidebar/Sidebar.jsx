import React from 'react';
import menuItems from './config/menuItems';
import { MenuItem, Divider } from './components';
import { LogOut } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const Sidebar = () => {
  const role    = useAuthStore(s => s.role);
  const logout  = useAuthStore(s => s.logout);

  const visibleItems = menuItems.filter(item =>
    item.type === 'divider' || item.roles?.includes(role)
  );

  return (
    <aside
      className="fixed left-2 top-2 bottom-2 w-64 rounded-box bg-base-100 shadow-sm flex flex-col bg-white"
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-base-200">
        <div className="w-9 h-9 rounded-lg bg-[#F5A623] flex items-center justify-center flex-shrink-0">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="4" fill="#F59E0B"/>
            <path d="M23.5 19.3333V12.6667C23.4994 12.0718 23.1818 11.5224 22.6667 11.225L16.8333 7.89166C16.3177 7.59394 15.6823 7.59394 15.1667 7.89166L9.33333 11.225C8.81819 11.5224 8.50061 12.0718 8.5 12.6667V19.3333C8.50061 19.9282 8.81819 20.4776 9.33333 20.775L15.1667 24.1083C15.6823 24.4061 16.3177 24.4061 16.8333 24.1083L22.6667 20.775C23.1818 20.4776 23.4994 19.9282 23.5 19.3333" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span className="text-lg font-bold tracking-wide text-base-content">IBEE</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1" role="menu">
          {visibleItems.map((item, index) =>
            item.type === 'divider'
              ? <Divider key={`divider-${index}`} />
              : <MenuItem key={item.href} item={item} />
          )}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-base-200">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                     text-error hover:bg-error/10
                     transition-colors duration-200 ease-in-out
                     text-sm font-medium
                     cursor-pointer"
          onClick={logout}
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